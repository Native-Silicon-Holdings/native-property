import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role: 'DIRECTOR' | 'MANAGER' | 'HOMEOWNER' | 'TENANT' | 'ACCOUNTANT';
  isActive: boolean;
  emailVerified: boolean;
  organizationId?: string;
  property?: any;
  createdAt: string;
  lastLogin?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithOAuth: (provider: 'google' | 'github') => Promise<void>;
  register: (data: { email: string; password: string; firstName: string; lastName: string }) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
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

/**
 * Maps a Supabase Auth user + core.users row to the app's User type.
 */
function mapSupabaseUser(
  supabaseUser: SupabaseUser,
  coreProfile?: { first_name: string; last_name: string; phone_number?: string } | null,
  orgMember?: { role: string; organization_id: string } | null
): User {
  return {
    id: supabaseUser.id,
    email: supabaseUser.email || '',
    firstName: coreProfile?.first_name || supabaseUser.user_metadata?.first_name || '',
    lastName: coreProfile?.last_name || supabaseUser.user_metadata?.last_name || '',
    phoneNumber: coreProfile?.phone_number || supabaseUser.user_metadata?.phone_number,
    role: (orgMember?.role as User['role']) || 'HOMEOWNER',
    isActive: true,
    emailVerified: supabaseUser.email_confirmed_at != null,
    organizationId: orgMember?.organization_id,
    createdAt: supabaseUser.created_at,
  };
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      if (currentSession?.user) {
        loadUserProfile(currentSession.user);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
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
      // Fetch core.users profile
      const { data: profile } = await supabase
        .schema('core')
        .from('users')
        .select('first_name, last_name, phone_number')
        .eq('id', supabaseUser.id)
        .single();

      // Fetch organization membership
      const { data: orgMember } = await supabase
        .schema('core')
        .from('organization_members')
        .select('role, organization_id')
        .eq('user_id', supabaseUser.id)
        .limit(1)
        .single();

      setUser(mapSupabaseUser(supabaseUser, profile, orgMember));
    } catch (error) {
      console.error('Error loading user profile:', error);
      setUser(mapSupabaseUser(supabaseUser));
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (data.user) await loadUserProfile(data.user);
  };

  const loginWithOAuth = async (provider: 'google' | 'github') => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
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
      // Create core.users row
      await supabase.schema('core').from('users').upsert({
        id: authData.user.id,
        email: data.email,
        first_name: data.firstName,
        last_name: data.lastName,
      });
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
    loginWithOAuth,
    register,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
