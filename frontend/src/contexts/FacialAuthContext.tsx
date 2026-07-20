import React, { createContext, useContext, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

export type FacialVerificationStatus = 'PENDING' | 'PROCESSING' | 'VERIFIED' | 'FAILED' | 'EXPIRED';

interface FacialVerification {
  id: string;
  status: FacialVerificationStatus;
  verificationScore?: number;
  failureReason?: string;
  verifiedAt?: string;
  expiresAt?: string;
}

interface FacialAuthContextType {
  verification: FacialVerification | null;
  loading: boolean;
  error: string | null;
  initializeVerification: (email: string) => Promise<string>;
  uploadVideo: (verificationId: string, file: File) => Promise<void>;
  checkStatus: (verificationId: string) => Promise<FacialVerificationStatus>;
  enableFacialAuth: () => Promise<void>;
  disableFacialAuth: () => Promise<void>;
  clearError: () => void;
}

const FacialAuthContext = createContext<FacialAuthContextType | undefined>(undefined);

export const useFacialAuth = () => {
  const context = useContext(FacialAuthContext);
  if (!context) {
    throw new Error('useFacialAuth must be used within a FacialAuthProvider');
  }
  return context;
};

interface FacialAuthProviderProps {
  children: ReactNode;
}

/**
 * Facial Auth as a second factor — requires an existing Supabase Auth session.
 *
 * Flow:
 * 1. User is already authenticated via Supabase Auth (primary gate)
 * 2. User initiates facial verification (e.g., before accessing sensitive actions)
 * 3. User uploads a compliance video
 * 4. System processes and verifies the facial data
 * 5. On success, the user's facial_verified flag is set in native_estate.facial_verifications
 *
 * The facial verification can be required for:
 * - Physical gate/kiosk access
 * - Sensitive document access
 * - Admin-configurable per estate
 */
export const FacialAuthProvider: React.FC<FacialAuthProviderProps> = ({ children }) => {
  const [verification, setVerification] = useState<FacialVerification | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  /**
   * Initialize a facial verification session.
   * Requires an authenticated user (this is a second factor, not a login).
   */
  const initializeVerification = async (_email: string): Promise<string> => {
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('You must be logged in to verify your face');

      // Session creation, cleanup of stale sessions, and activity logging
      // all happen server-side in this RPC so the client can't forge an
      // audit trail or fabricate a verification row directly.
      const { data, error: initError } = await supabase.rpc('rpc_initialize_facial_verification');

      if (initError) throw initError;

      setVerification({
        id: data.verification_id,
        status: data.status as FacialVerificationStatus,
        expiresAt: data.expires_at,
      });

      return data.verification_id;
    } catch (err: any) {
      setError(err.message || 'Failed to initialize facial verification');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Upload a video for facial verification. The final VERIFIED/FAILED
   * outcome is set later by an external face-matching service, not here.
   */
  const uploadVideo = async (verificationId: string, file: File): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Upload to a private bucket — the video is never publicly reachable.
      const fileName = `${user.id}/${verificationId}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('facial-videos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // rpc_submit_facial_verification stores the storage path, flips
      // PENDING -> PROCESSING, and logs the activity server-side. The
      // actual VERIFIED/FAILED outcome is set later by the face-matching
      // service via rpc_complete_facial_verification (service-role only),
      // not by this client.
      const { error: submitError } = await supabase.rpc('rpc_submit_facial_verification', {
        p_verification_id: verificationId,
        p_video_url: fileName,
      });

      if (submitError) throw submitError;

      setVerification((prev) => prev ? { ...prev, status: 'PROCESSING' } : null);

      pollVerificationStatus(verificationId);
    } catch (err: any) {
      setError(err.message || 'Failed to upload verification video');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Poll verification status (simulates async processing).
   */
  const pollVerificationStatus = async (verificationId: string): Promise<void> => {
    const maxAttempts = 30;
    let attempts = 0;

    const poll = async () => {
      if (attempts >= maxAttempts) {
        setVerification((prev) => prev ? { ...prev, status: 'FAILED', failureReason: 'Verification timed out' } : null);
        return;
      }

      attempts++;
      const status = await checkStatus(verificationId);

      if (status === 'VERIFIED' || status === 'FAILED' || status === 'EXPIRED') {
        return; // Terminal state
      }

      // Continue polling
      setTimeout(poll, 2000);
    };

    poll();
  };

  /**
   * Check the current status of a verification.
   */
  const checkStatus = async (verificationId: string): Promise<FacialVerificationStatus> => {
    const { data, error } = await supabase
      .schema('native_estate')
      .from('facial_verifications')
      .select('status, verification_score, failure_reason, verified_at')
      .eq('id', verificationId)
      .single();

    if (error) throw error;

    const status = data.status as FacialVerificationStatus;
    setVerification((prev) => prev ? {
      ...prev,
      status,
      verificationScore: data.verification_score,
      failureReason: data.failure_reason,
      verifiedAt: data.verified_at,
    } : null);

    return status;
  };

  /**
   * Enable facial auth as a second factor for the current user.
   */
  const enableFacialAuth = async (): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Store preference in user metadata or a dedicated table
    await supabase.auth.updateUser({
      data: { facial_auth_enabled: true },
    });
  };

  /**
   * Disable facial auth for the current user.
   */
  const disableFacialAuth = async (): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    await supabase.auth.updateUser({
      data: { facial_auth_enabled: false },
    });

    setVerification(null);
  };

  const value: FacialAuthContextType = {
    verification,
    loading,
    error,
    initializeVerification,
    uploadVideo,
    checkStatus,
    enableFacialAuth,
    disableFacialAuth,
    clearError,
  };

  return <FacialAuthContext.Provider value={value}>{children}</FacialAuthContext.Provider>;
};
