import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { FacialAuthProvider } from './contexts/FacialAuthContext';
import Layout from './components/layout/Layout';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import FacialAuthPage from './pages/auth/FacialAuthPage';
import Dashboard from './pages/Dashboard';
import Documents from './pages/documents/Documents';
import DocumentDetail from './pages/documents/DocumentDetail';
import Announcements from './pages/announcements/Announcements';
import AnnouncementDetail from './pages/announcements/AnnouncementDetail';
import Meetings from './pages/meetings/Meetings';
import MeetingDetail from './pages/meetings/MeetingDetail';
import Utilities from './pages/utilities/Utilities';
import Maintenance from './pages/maintenance/Maintenance';
import MaintenanceDetail from './pages/maintenance/MaintenanceDetail';
import Properties from './pages/properties/Properties';
import PropertyDetail from './pages/properties/PropertyDetail';
import Users from './pages/users/Users';
import Profile from './pages/Profile';
import FinancialDashboard from './pages/financial/FinancialDashboard';
import Directors from './pages/directors/Directors';
import Elections from './pages/elections/Elections';
import ElectionDetail from './pages/elections/ElectionDetail';
import Voting from './pages/voting/Voting';

// Protected Route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Public Route component (redirect to dashboard if already logged in)
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

      {/* Protected routes */}
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="profile" element={<Profile />} />
        <Route path="facial-verification" element={<FacialAuthPage />} />

        {/* Documents */}
        <Route path="documents" element={<Documents />} />
        <Route path="documents/:id" element={<DocumentDetail />} />

        {/* Announcements */}
        <Route path="announcements" element={<Announcements />} />
        <Route path="announcements/:id" element={<AnnouncementDetail />} />

        {/* Meetings */}
        <Route path="meetings" element={<Meetings />} />
        <Route path="meetings/:id" element={<MeetingDetail />} />

        {/* Utilities */}
        <Route path="utilities" element={<Utilities />} />

        {/* Maintenance */}
        <Route path="maintenance" element={<Maintenance />} />
        <Route path="maintenance/:id" element={<MaintenanceDetail />} />

        {/* Properties */}
        <Route path="properties" element={<Properties />} />
        <Route path="properties/:id" element={<PropertyDetail />} />

        {/* Users */}
        <Route path="users" element={<Users />} />

        {/* Financial */}
        <Route path="financial" element={<FinancialDashboard />} />

        {/* Directors */}
        <Route path="directors" element={<Directors />} />

        {/* Elections */}
        <Route path="elections" element={<Elections />} />
        <Route path="elections/:id" element={<ElectionDetail />} />

        {/* Voting */}
        <Route path="voting/:electionId" element={<Voting />} />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
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
