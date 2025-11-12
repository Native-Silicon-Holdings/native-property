import { Request, Response } from 'express';
import { PrismaClient, FacialVerificationStatus } from '@prisma/client';
import { sendSuccess, sendBadRequest, sendUnauthorized, sendNotFound, sendServerError } from '../utils/response.util';
import { generateToken } from '../utils/jwt.util';
import fs from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();

/**
 * Initialize facial verification for a user
 * This creates a verification record and prepares for video upload
 */
export const initializeFacialVerification = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      sendBadRequest(res, 'Email is required');
      return;
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        facialAuthEnabled: true,
        facialVerified: true,
      },
    });

    if (!user) {
      sendNotFound(res, 'User not found');
      return;
    }

    if (!user.facialAuthEnabled) {
      sendBadRequest(res, 'Facial authentication is not enabled for this account');
      return;
    }

    // Create a new verification session
    const verification = await prisma.facialVerification.create({
      data: {
        userId: user.id,
        status: FacialVerificationStatus.PENDING,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes expiry
      },
    });

    sendSuccess(res, 'Facial verification initialized', {
      verificationId: verification.id,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  } catch (error) {
    console.error('Error initializing facial verification:', error);
    sendServerError(res, 'Failed to initialize facial verification');
  }
};

/**
 * Upload facial verification video
 * In production, this would integrate with a facial recognition service
 */
export const uploadVerificationVideo = async (req: Request, res: Response) => {
  try {
    const { verificationId } = req.params;
    const file = req.file;

    if (!file) {
      sendBadRequest(res, 'Video file is required');
      return;
    }

    // Validate verification session
    const verification = await prisma.facialVerification.findUnique({
      where: { id: verificationId },
      include: { user: true },
    });

    if (!verification) {
      sendNotFound(res, 'Verification session not found');
      return;
    }

    // Check if session has expired
    if (verification.expiresAt && verification.expiresAt < new Date()) {
      await prisma.facialVerification.update({
        where: { id: verificationId },
        data: { status: FacialVerificationStatus.EXPIRED },
      });
      sendBadRequest(res, 'Verification session has expired');
      return;
    }

    // Update verification with video URL
    const updatedVerification = await prisma.facialVerification.update({
      where: { id: verificationId },
      data: {
        videoUrl: file.path,
        status: FacialVerificationStatus.PROCESSING,
        metadata: {
          filename: file.filename,
          size: file.size,
          mimetype: file.mimetype,
        },
      },
    });

    // In production, you would:
    // 1. Send the video to a facial recognition service (e.g., AWS Rekognition, Azure Face API)
    // 2. Compare with stored facial data
    // 3. Update verification status based on results

    // For this MVP, we'll simulate verification after a delay
    // In production, this would be handled by a background job/webhook
    setTimeout(async () => {
      try {
        await processFacialVerification(verificationId);
      } catch (error) {
        console.error('Error processing facial verification:', error);
      }
    }, 2000);

    sendSuccess(res, 'Video uploaded successfully. Verification in progress.', {
      verificationId: updatedVerification.id,
      status: updatedVerification.status,
    });
  } catch (error) {
    console.error('Error uploading verification video:', error);
    sendServerError(res, 'Failed to upload verification video');
  }
};

/**
 * Simulate facial verification processing
 * In production, this would be replaced with actual facial recognition
 */
async function processFacialVerification(verificationId: string) {
  try {
    const verification = await prisma.facialVerification.findUnique({
      where: { id: verificationId },
    });

    if (!verification) return;

    // Simulate facial recognition (90% success rate for demo)
    const isVerified = Math.random() > 0.1;
    const score = isVerified ? 0.85 + Math.random() * 0.15 : 0.3 + Math.random() * 0.3;

    if (isVerified) {
      // Update verification as successful
      await prisma.facialVerification.update({
        where: { id: verificationId },
        data: {
          status: FacialVerificationStatus.VERIFIED,
          verificationScore: score,
          verifiedAt: new Date(),
        },
      });

      // Update user's facial verification status
      await prisma.user.update({
        where: { id: verification.userId },
        data: { facialVerified: true },
      });
    } else {
      // Update verification as failed
      await prisma.facialVerification.update({
        where: { id: verificationId },
        data: {
          status: FacialVerificationStatus.FAILED,
          verificationScore: score,
          failureReason: 'Face could not be verified. Please ensure good lighting and face the camera directly.',
        },
      });
    }
  } catch (error) {
    console.error('Error processing facial verification:', error);
  }
}

/**
 * Check verification status
 */
export const getVerificationStatus = async (req: Request, res: Response) => {
  try {
    const { verificationId } = req.params;

    const verification = await prisma.facialVerification.findUnique({
      where: { id: verificationId },
      select: {
        id: true,
        status: true,
        verificationScore: true,
        failureReason: true,
        verifiedAt: true,
        createdAt: true,
        expiresAt: true,
      },
    });

    if (!verification) {
      sendNotFound(res, 'Verification session not found');
      return;
    }

    sendSuccess(res, 'Verification status retrieved', { verification });
  } catch (error) {
    console.error('Error getting verification status:', error);
    sendServerError(res, 'Failed to get verification status');
  }
};

/**
 * Login with facial verification
 * Once verification is complete, user can authenticate
 */
export const loginWithFacialAuth = async (req: Request, res: Response) => {
  try {
    const { verificationId } = req.body;

    if (!verificationId) {
      sendBadRequest(res, 'Verification ID is required');
      return;
    }

    // Get verification with user details
    const verification = await prisma.facialVerification.findUnique({
      where: { id: verificationId },
      include: {
        user: {
          include: {
            property: true,
          },
        },
      },
    });

    if (!verification) {
      sendNotFound(res, 'Verification session not found');
      return;
    }

    // Check if verification is successful
    if (verification.status !== FacialVerificationStatus.VERIFIED) {
      sendUnauthorized(res, 'Facial verification not completed or failed');
      return;
    }

    // Check if user is active
    if (!verification.user.isActive) {
      sendUnauthorized(res, 'Account is inactive');
      return;
    }

    // Generate JWT token
    const token = generateToken({
      userId: verification.user.id,
      email: verification.user.email,
      role: verification.user.role,
    });

    // Update last login
    await prisma.user.update({
      where: { id: verification.user.id },
      data: { lastLogin: new Date() },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: verification.user.id,
        action: 'LOGIN',
        module: 'AUTH',
        details: {
          method: 'facial_recognition',
          verificationId: verification.id,
        },
        ipAddress: req.ip,
      },
    });

    // Remove sensitive data
    const { passwordHash, ...userWithoutPassword } = verification.user;

    sendSuccess(res, 'Login successful', {
      user: userWithoutPassword,
      token,
    });
  } catch (error) {
    console.error('Error logging in with facial auth:', error);
    sendServerError(res, 'Failed to login with facial authentication');
  }
};

/**
 * Enable facial authentication for a user
 * User must be authenticated to enable this feature
 */
export const enableFacialAuth = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      sendUnauthorized(res, 'User not authenticated');
      return;
    }

    // Update user to enable facial auth
    const user = await prisma.user.update({
      where: { id: userId },
      data: { facialAuthEnabled: true },
      select: {
        id: true,
        email: true,
        facialAuthEnabled: true,
        facialVerified: true,
      },
    });

    sendSuccess(res, 'Facial authentication enabled', { user });
  } catch (error) {
    console.error('Error enabling facial auth:', error);
    sendServerError(res, 'Failed to enable facial authentication');
  }
};

/**
 * Disable facial authentication for a user
 */
export const disableFacialAuth = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      sendUnauthorized(res, 'User not authenticated');
      return;
    }

    // Update user to disable facial auth
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        facialAuthEnabled: false,
        facialVerified: false,
      },
      select: {
        id: true,
        email: true,
        facialAuthEnabled: true,
        facialVerified: true,
      },
    });

    sendSuccess(res, 'Facial authentication disabled', { user });
  } catch (error) {
    console.error('Error disabling facial auth:', error);
    sendServerError(res, 'Failed to disable facial authentication');
  }
};
