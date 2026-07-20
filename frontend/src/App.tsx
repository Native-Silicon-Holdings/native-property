import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { FacialAuthProvider } from './contexts/FacialAuthContext';
import { useEstate } from './contexts/EstateContext';
import { supabase } from './lib/supabase';
import Layout from './components/layout/Layout';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import FacialAuthPage from './pages/auth/FacialAuthPage';
import Portfolio from './pages/portfolio/Portfolio';
import EstateHome from './pages/estate/EstateHome';
import Documents from './pages/documents/Documents';
import DocumentDetail from './pages/documents/DocumentDetail';
import Announcements from './pages/announcements/Announcements';
import AnnouncementDetail from './pages/announcements/AnnouncementDetail';
import Meetings from './pages/meetings/Meetings';
import MeetingDetail from './pages/meetings/MeetingDetail';
import Utilities from './pages/utilities/Utilities';
import Maintenance from './pages/maintenance/Maintenance';
import MaintenanceDetail from './pages/maintenance/MaintenanceDetail';
import Units from './pages/units/Units';
import UnitDetail from './pages/units/UnitDetail';
import Users from './pages/users/Users';
import Profile from './pages/Profile';
import FinancialDashboard from './pages/financial/FinancialDashboard';
import Directors from './pages/directors/Directors';
import Elections from './pages/elections/Elections';
import ElectionDetail from './pages/elections/ElectionDetail';
import Voting from './pages/voting/Voting';

const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;

  return <>{children}</>;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (user) return <Navigate to="/" replace />;

  return <>{children}</>;
};

/** Gate for portfolio chrome: org staff (OWNER/ADMIN/MANAGER) only. */
const StaffRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  if (!user?.isOrgStaff) return <Navigate to="/no-access" replace />;
  return <>{children}</>;
};

/** Shown when the user is signed in but has no org / estate access (avoids redirect loops). */
function NoAccess() {
  const { user, logout } = useAuth();
  return (
    <div className="max-w-lg mx-auto py-20 text-center space-y-4">
      <h1 className="font-display text-3xl text-foreground">No estate access yet</h1>
      <p className="text-muted-foreground">
        {user?.email
          ? `Signed in as ${user.email}, but this account is not linked to an organization or estate.`
          : 'This account is not linked to an organization or estate.'}
      </p>
      <p className="text-sm text-muted-foreground">
        Ask your managing agent to invite you, or sign in with an org staff account.
      </p>
      <button
        type="button"
        onClick={() => logout()}
        className="inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium"
      >
        Sign out
      </button>
    </div>
  );
}

/**
 * Resolves where a user should land when there's no explicit estate in the URL:
 * multi-estate staff go to the portfolio grid; everyone else auto-opens their
 * (single) estate. Also backs the legacy /dashboard and /properties redirects.
 */
function useModuleDestination(module: string) {
  const { user } = useAuth();
  const { estates, loading: estatesLoading } = useEstate();
  const [residentSlug, setResidentSlug] = useState<string | null>(null);
  const [residentLoading, setResidentLoading] = useState(false);

  useEffect(() => {
    if (!user || user.isOrgStaff) return;
    let active = true;
    setResidentLoading(true);
    void (async () => {
      try {
        const { data } = await supabase
          .schema('native_estate')
          .from('estate_members')
          .select('estates(slug)')
          .eq('user_id', user.coreUserId)
          .limit(1)
          .maybeSingle();
        if (active) setResidentSlug((data as any)?.estates?.slug || null);
      } finally {
        if (active) setResidentLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [user]);

  const loading = estatesLoading || (!!user && !user.isOrgStaff && residentLoading);

  if (loading || !user) return { loading, path: null as string | null };

  if (!user.organizationId && !user.isOrgStaff) {
    return { loading, path: '/no-access' };
  }

  if (user.isOrgStaff) {
    // Single-estate orgs auto-open that estate; multi-estate orgs land on the portfolio grid.
    if (estates.length === 1) return { loading, path: `/e/${estates[0].slug}/${module}` };
    if (estates.length === 0) return { loading, path: '/portfolio' };
    return { loading, path: '/portfolio' };
  }

  if (residentSlug) return { loading, path: `/e/${residentSlug}/${module}` };
  if (estates.length > 0) return { loading, path: `/e/${estates[0].slug}/${module}` };

  return { loading, path: '/no-access' };
}

function RootRedirect() {
  const { loading, path } = useModuleDestination('home');
  if (loading) return <LoadingScreen />;
  return <Navigate to={path || '/no-access'} replace />;
}

/** Legacy `/properties` -> `/e/:estateSlug/units`. */
function LegacyUnitsListRedirect() {
  const { loading, path } = useModuleDestination('units');
  if (loading) return <LoadingScreen />;
  return <Navigate to={path || '/portfolio'} replace />;
}

/** Legacy `/properties/:id` -> `/e/:estateSlug/units/:id`, resolving the estate from the unit. */
function LegacyUnitDetailRedirect() {
  const { id } = useParams<{ id: string }>();
  const [target, setTarget] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    void (async () => {
      try {
        const { data } = await supabase
          .schema('native_estate')
          .from('units')
          .select('id, estates(slug)')
          .eq('id', id)
          .maybeSingle();
        const slug = (data as any)?.estates?.slug;
        setTarget(slug ? `/e/${slug}/units/${id}` : null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <LoadingScreen />;
  return <Navigate to={target || '/portfolio'} replace />;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

      {/* Protected routes */}
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<RootRedirect />} />

        {/* Portfolio (org staff only) */}
        <Route path="portfolio" element={<StaffRoute><Portfolio /></StaffRoute>} />
        <Route path="no-access" element={<NoAccess />} />

        {/* Estate modules -- URL is the estate source of truth */}
        <Route path="e/:estateSlug/home" element={<EstateHome />} />
        <Route path="e/:estateSlug/profile" element={<Profile />} />
        <Route path="e/:estateSlug/facial-verification" element={<FacialAuthPage />} />

        <Route path="e/:estateSlug/documents" element={<Documents />} />
        <Route path="e/:estateSlug/documents/:id" element={<DocumentDetail />} />

        <Route path="e/:estateSlug/announcements" element={<Announcements />} />
        <Route path="e/:estateSlug/announcements/:id" element={<AnnouncementDetail />} />

        <Route path="e/:estateSlug/meetings" element={<Meetings />} />
        <Route path="e/:estateSlug/meetings/:id" element={<MeetingDetail />} />

        <Route path="e/:estateSlug/utilities" element={<Utilities />} />

        <Route path="e/:estateSlug/maintenance" element={<Maintenance />} />
        <Route path="e/:estateSlug/maintenance/:id" element={<MaintenanceDetail />} />

        <Route path="e/:estateSlug/units" element={<Units />} />
        <Route path="e/:estateSlug/units/:id" element={<UnitDetail />} />

        <Route path="e/:estateSlug/users" element={<Users />} />

        <Route path="e/:estateSlug/financial" element={<FinancialDashboard />} />

        <Route path="e/:estateSlug/directors" element={<Directors />} />

        <Route path="e/:estateSlug/elections" element={<Elections />} />
        <Route path="e/:estateSlug/elections/:id" element={<ElectionDetail />} />

        <Route path="e/:estateSlug/voting/:electionId" element={<Voting />} />

        {/* Legacy redirects */}
        <Route path="dashboard" element={<RootRedirect />} />
        <Route path="properties" element={<LegacyUnitsListRedirect />} />
        <Route path="properties/:id" element={<LegacyUnitDetailRedirect />} />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <FacialAuthProvider>
          <AppRoutes />
        </FacialAuthProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
