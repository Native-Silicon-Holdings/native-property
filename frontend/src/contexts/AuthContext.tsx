import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

/** Organization-level role, sourced from core.organization_members. */
export type OrgRole = 'OWNER' | 'ADMIN' | 'MANAGER' | 'MEMBER';

/** Estate-level role, sourced from native_estate.estate_members. */
export type EstateRole = 'DIRECTOR' | 'HOMEOWNER' | 'TENANT' | 'ACCOUNTANT';

const ORG_STAFF_ROLES: OrgRole[] = ['OWNER', 'ADMIN', 'MANAGER'];

export interface OrganizationMembership {
  organizationId: string;
  organizationName?: string;
  role: OrgRole;
}

export interface User {
  id: string;
  /** core.users.id (cuid) — use for FK joins into core / native_estate */
  coreUserId: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  /** All organizations this user belongs to. */
  organizations: OrganizationMembership[];
  /** The currently active organization (from JWT app_metadata, else the first membership). */
  organizationId?: string;
  organizationName?: string;
  /** Role within the active organization. */
  orgRole?: OrgRole;
  /** Whether the active org role grants portfolio/staff chrome (OWNER/ADMIN/MANAGER). */
  isOrgStaff: boolean;
  /** Best-effort estate role for the user (refined per-estate by EstateContext). */
  estateRole?: EstateRole;
  /**
   * @deprecated Legacy combined role used by older pages. Prefer `orgRole` / `estateRole`.
   */
  role: EstateRole | OrgRole;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  lastLogin?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  /** Authentik → GoTrue SAML SSO (domain must be registered with Supabase SSO). */
  loginWithSSO: (domain?: string) => Promise<void>;
  loginWithOAuth: (provider: 'google' | 'github') => Promise<void>;
  register: (data: { email: string; password: string; firstName: string; lastName: string }) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
}

/** TEXT cuid-like id for core.users when the DB has no default. */
function newCoreUserId(): string {
  return `c${crypto.randomUUID().replace(/-/g, '')}`;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

function splitName(name?: string | null): { firstName: string; lastName: string } {
  if (!name?.trim()) return { firstName: '', lastName: '' };
  const parts = name.trim().split(/\s+/);
  return {
    firstName: parts[0] || '',
    lastName: parts.slice(1).join(' ') || '',
  };
}

/**
 * Maps a Supabase Auth user + core profile + org memberships into the app's User type.
 */
function mapSupabaseUser(
  supabaseUser: SupabaseUser,
  coreProfile: { id: string; name?: string | null; email?: string | null } | null,
  memberships: OrganizationMembership[] = [],
  estateRole?: EstateRole
): User {
  const jwtOrgId = (supabaseUser.app_metadata as Record<string, unknown> | undefined)?.organizationId as
    | string
    | undefined;

  const activeMembership =
    memberships.find((m) => m.organizationId === jwtOrgId) || memberships[0];

  const orgRole = activeMembership?.role;
  const isOrgStaff = !!orgRole && ORG_STAFF_ROLES.includes(orgRole);
  const fromCore = splitName(coreProfile?.name);
  const firstName =
    fromCore.firstName ||
    supabaseUser.user_metadata?.first_name ||
    '';
  const lastName =
    fromCore.lastName ||
    supabaseUser.user_metadata?.last_name ||
    '';

  return {
    id: supabaseUser.id,
    coreUserId: coreProfile?.id || supabaseUser.id,
    email: coreProfile?.email || supabaseUser.email || '',
    firstName,
    lastName,
    organizations: memberships,
    organizationId: activeMembership?.organizationId,
    organizationName: activeMembership?.organizationName,
    orgRole,
    isOrgStaff,
    estateRole,
    role: estateRole || orgRole || 'HOMEOWNER',
    isActive: true,
    emailVerified: supabaseUser.email_confirmed_at != null,
    createdAt: supabaseUser.created_at,
  };
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      if (currentSession?.user) {
        loadUserProfile(currentSession.user);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession);
        if (newSession?.user) {
          await loadUserProfile(newSession.user);
        } else {
          setUser(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (supabaseUser: SupabaseUser) => {
    try {
      // core.users.id is a cuid; auth.uid() maps via supabase_id
      const { data: profile } = await supabase
        .schema('core')
        .from('users')
        .select('id, name, email')
        .eq('supabase_id', supabaseUser.id)
        .maybeSingle();

      if (!profile?.id) {
        console.warn('No core.users row for supabase_id', supabaseUser.id);
        setUser(mapSupabaseUser(supabaseUser, null, []));
        return;
      }

      const { data: orgMembers } = await supabase
        .schema('core')
        .from('organization_members')
        .select('role, organization_id')
        .eq('user_id', profile.id);

      const orgIds = (orgMembers || []).map((m) => m.organization_id);
      let orgNames = new Map<string, string>();
      if (orgIds.length > 0) {
        const { data: orgs } = await supabase
          .schema('core')
          .from('organizations')
          .select('id, name')
          .in('id', orgIds);
        orgNames = new Map((orgs || []).map((o) => [o.id, o.name]));
      }

      const memberships: OrganizationMembership[] = (orgMembers || []).map((m) => ({
        organizationId: m.organization_id,
        organizationName: orgNames.get(m.organization_id),
        role: m.role as OrgRole,
      }));

      let estateRole: EstateRole | undefined;
      try {
        const { data: estateMember } = await supabase
          .schema('native_estate')
          .from('estate_members')
          .select('role')
          .eq('user_id', profile.id)
          .limit(1)
          .maybeSingle();
        estateRole = estateMember?.role as EstateRole | undefined;
      } catch {
        // No estate membership — fine for org staff.
      }

      setUser(mapSupabaseUser(supabaseUser, profile, memberships, estateRole));
    } catch (error) {
      console.error('Error loading user profile:', error);
      setUser(mapSupabaseUser(supabaseUser, null));
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (data.user) await loadUserProfile(data.user);
  };

  const loginWithSSO = async (domain?: string) => {
    const ssoDomain =
      domain ||
      import.meta.env.VITE_SSO_DOMAIN ||
      'nativesilicon.co.za';

    const { error } = await supabase.auth.signInWithSSO({
      domain: ssoDomain,
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
    if (error) throw error;
  };

  const loginWithOAuth = async (provider: 'google' | 'github') => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
    if (error) throw error;
  };

  const register = async (data: { email: string; password: string; firstName: string; lastName: string }) => {
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          first_name: data.firstName,
          last_name: data.lastName,
        },
      },
    });
    if (error) throw error;
    if (authData.user) {
      const fullName = `${data.firstName} ${data.lastName}`.trim();
      // Bridge by supabase_id — never use the Auth UUID as core.users.id (cuid).
      const { data: existing } = await supabase
        .schema('core')
        .from('users')
        .select('id')
        .eq('supabase_id', authData.user.id)
        .maybeSingle();

      if (!existing) {
        const { error: insertError } = await supabase.schema('core').from('users').insert({
          id: newCoreUserId(),
          email: data.email,
          name: fullName || data.email,
          supabase_id: authData.user.id,
          password_hash: '',
          role: 'USER',
        });
        if (insertError) {
          console.error('Failed to create core.users bridge row:', insertError);
          throw insertError;
        }
      }
      await loadUserProfile(authData.user);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    login,
    loginWithSSO,
    loginWithOAuth,
    register,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
