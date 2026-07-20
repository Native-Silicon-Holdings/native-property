import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useFacialAuth } from '../../contexts/FacialAuthContext';
import ComplianceVerification from '../../components/auth/ComplianceVerification';
import { Loader2 } from 'lucide-react';

/**
 * Facial verification as a second factor. Only reachable once the user
 * already has a Supabase Auth session — this is not an alternative login path.
 */
const FacialAuthPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { initializeVerification, loading, error: contextError } = useFacialAuth();

  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const returnTo = (location.state as { returnTo?: string })?.returnTo || '/';

  useEffect(() => {
    if (!user) return;

    initializeVerification(user.email)
      .then(setVerificationId)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to initialize facial verification'));
  }, [user]);

  const handleVerificationComplete = () => {
    navigate(returnTo, { replace: true });
  };

  const handleCancel = () => {
    navigate(returnTo, { replace: true });
  };

  if (loading || !verificationId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-accent mx-auto mb-4" />
          <p className="text-muted-foreground">Initializing facial verification...</p>
          {(error || contextError) && (
            <p className="text-destructive text-sm mt-4">{error || contextError}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <ComplianceVerification
        verificationId={verificationId}
        onVerificationComplete={handleVerificationComplete}
        onCancel={handleCancel}
      />
    </div>
  );
};

export default FacialAuthPage;
