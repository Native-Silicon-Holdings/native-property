import React, { createContext, useContext, useEffect, useMemo, useState, ReactNode, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

export interface Estate {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  coverUrl?: string;
  address?: string;
  active: boolean;
  createdAt: string;
}

interface EstateContextType {
  estates: Estate[];
  activeEstate: Estate | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  /** Navigate to `slug`, preserving the current module path under /e/:slug/... */
  switchEstate: (slug: string) => void;
  createEstate: (data: { name: string; slug: string; address?: string; coverUrl?: string }) => Promise<Estate>;
}

const EstateContext = createContext<EstateContextType | undefined>(undefined);

export const useEstate = () => {
  const context = useContext(EstateContext);
  if (!context) {
    throw new Error('useEstate must be used within an EstateProvider');
  }
  return context;
};

function mapEstateRow(row: any): Estate {
  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    slug: row.slug,
    coverUrl: row.cover_url,
    address: row.address,
    active: row.active,
    createdAt: row.created_at,
  };
}

interface EstateProviderProps {
  children: ReactNode;
}

export const EstateProvider: React.FC<EstateProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const { estateSlug } = useParams<{ estateSlug?: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [estates, setEstates] = useState<Estate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEstates = useCallback(async () => {
    if (!user?.organizationId) {
      setEstates([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .schema('native_estate')
        .from('estates')
        .select('*')
        .eq('organization_id', user.organizationId)
        .eq('active', true)
        .order('name', { ascending: true });

      if (fetchError) throw fetchError;
      setEstates((data || []).map(mapEstateRow));
    } catch (err: any) {
      console.error('Error loading estates:', err);
      setError(err.message || 'Failed to load estates');
    } finally {
      setLoading(false);
    }
  }, [user?.organizationId]);

  useEffect(() => {
    fetchEstates();
  }, [fetchEstates]);

  const activeEstate = useMemo(() => {
    if (!estateSlug) return null;
    return estates.find((e) => e.slug === estateSlug) || null;
  }, [estates, estateSlug]);

  const switchEstate = useCallback(
    (slug: string) => {
      const match = location.pathname.match(/^\/e\/[^/]+(\/.*)?$/);
      const modulePath = match?.[1] || '/home';
      navigate(`/e/${slug}${modulePath}`);
    },
    [location.pathname, navigate]
  );

  const createEstate = useCallback(
    async (data: { name: string; slug: string; address?: string; coverUrl?: string }) => {
      if (!user?.organizationId) throw new Error('No active organization');

      const { data: created, error: createError } = await supabase
        .schema('native_estate')
        .from('estates')
        .insert({
          organization_id: user.organizationId,
          name: data.name,
          slug: data.slug,
          address: data.address,
          cover_url: data.coverUrl,
        })
        .select()
        .single();

      if (createError) throw createError;

      const estate = mapEstateRow(created);
      setEstates((prev) => [...prev, estate].sort((a, b) => a.name.localeCompare(b.name)));
      return estate;
    },
    [user?.organizationId]
  );

  const value: EstateContextType = {
    estates,
    activeEstate,
    loading,
    error,
    refresh: fetchEstates,
    switchEstate,
    createEstate,
  };

  return <EstateContext.Provider value={value}>{children}</EstateContext.Provider>;
};
