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
 * 5. On success, the user's facial_verified flag is set in native_property.facial_verifications
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
  const initializeVerification = async (email: string): Promise<string> => {
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('You must be logged in to verify your face');

      // Check if user has facial auth enabled
      const { data: facialSetting } = await supabase
        .schema('native_property')
        .from('facial_verifications')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'VERIFIED')
        .limit(1)
        .maybeSingle();

      // Clean up old pending/expired verifications
      await supabase
        .schema('native_property')
        .from('facial_verifications')
        .delete()
        .eq('user_id', user.id)
        .in('status', ['PENDING', 'EXPIRED']);

      // Create new verification session
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutes
      const { data: newVerification, error: createError } = await supabase
        .schema('native_property')
        .from('facial_verifications')
        .insert({
          user_id: user.id,
          status: 'PENDING',
          expires_at: expiresAt,
          metadata: {
            ipAddress: 'client-side',
            userAgent: navigator.userAgent,
            initiatedAt: new Date().toISOString(),
          },
        })
        .select('id, status, expires_at')
        .single();

      if (createError) throw createError;

      // Log activity
      await supabase
        .schema('native_property')
        .from('activity_logs')
        .insert({
          user_id: user.id,
          action: 'FACIAL_VERIFICATION_INITIALIZED',
          module: 'FACIAL_AUTH',
          details: { verificationId: newVerification.id },
        });

      setVerification({
        id: newVerification.id,
        status: newVerification.status as FacialVerificationStatus,
        expiresAt: newVerification.expires_at,
      });

      return newVerification.id;
    } catch (err: any) {
      setError(err.message || 'Failed to initialize facial verification');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Upload a video for facial verification.
   * In production, this would integrate with an external face-matching service
   * via a SECURITY DEFINER RPC function.
   */
  const uploadVideo = async (verificationId: string, file: File): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Upload video to Supabase Storage
      const fileName = `${user.id}/${verificationId}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('facial-videos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('facial-videos')
        .getPublicUrl(fileName);

      // Update verification record
      const { error: updateError } = await supabase
        .schema('native_property')
        .from('facial_verifications')
        .update({
          video_url: urlData.publicUrl,
          status: 'PROCESSING',
          metadata: {
            uploadedAt: new Date().toISOString(),
            filename: file.name,
            size: file.size,
            mimetype: file.type,
          },
        })
        .eq('id', verificationId);

      if (updateError) throw updateError;

      // Log activity
      await supabase
        .schema('native_property')
        .from('activity_logs')
        .insert({
          user_id: user.id,
          action: 'FACIAL_VERIFICATION_VIDEO_UPLOADED',
          module: 'FACIAL_AUTH',
          details: {
            verificationId,
            fileSize: file.size,
            fileType: file.type,
          },
        });

      setVerification((prev) => prev ? { ...prev, status: 'PROCESSING' } : null);

      // In production: trigger a SECURITY DEFINER RPC that calls an external
      // face-matching service and updates the verification status.
      // For now, poll the status.
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
      .schema('native_property')
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
