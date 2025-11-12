import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import {
  initializeFacialVerification,
  uploadVerificationVideo,
  getVerificationStatus,
  loginWithFacialAuth,
  enableFacialAuth,
  disableFacialAuth,
} from '../controllers/facial-auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import {
  facialAuthRateLimiter,
  videoUploadRateLimiter,
  loginRateLimiter,
} from '../middleware/rate-limit.middleware';
import {
  validateVideoUpload,
  sanitizeVerificationId,
  validateEmailInput,
} from '../middleware/video-validation.middleware';

const router = Router();

// Configure multer for video uploads with enhanced security
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/facial-verifications');
    // Ensure directory exists with restricted permissions
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true, mode: 0o750 });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Use crypto for secure random filename generation
    const randomName = crypto.randomBytes(16).toString('hex');
    const timestamp = Date.now();
    const extension = path.extname(file.originalname).toLowerCase();

    // Validate extension
    const allowedExtensions = ['.mp4', '.webm', '.ogg'];
    if (!allowedExtensions.includes(extension)) {
      cb(new Error('Invalid file extension'), '');
      return;
    }

    // Format: facial-[timestamp]-[random].ext
    cb(null, `facial-${timestamp}-${randomName}${extension}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ['video/mp4', 'video/webm', 'video/ogg'];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only video files are allowed.'));
    }
  },
});

/**
 * @route   POST /api/facial-auth/initialize
 * @desc    Initialize facial verification session
 * @access  Public
 * @security Rate limited, email validation
 */
router.post(
  '/initialize',
  facialAuthRateLimiter,
  validateEmailInput,
  initializeFacialVerification
);

/**
 * @route   POST /api/facial-auth/upload/:verificationId
 * @desc    Upload verification video
 * @access  Public
 * @security Rate limited, video validation, ID sanitization
 */
router.post(
  '/upload/:verificationId',
  videoUploadRateLimiter,
  sanitizeVerificationId,
  upload.single('video'),
  validateVideoUpload,
  uploadVerificationVideo
);

/**
 * @route   GET /api/facial-auth/status/:verificationId
 * @desc    Get verification status
 * @access  Public
 * @security ID sanitization
 */
router.get(
  '/status/:verificationId',
  sanitizeVerificationId,
  getVerificationStatus
);

/**
 * @route   POST /api/facial-auth/login
 * @desc    Login with facial verification
 * @access  Public
 * @security Rate limited
 */
router.post(
  '/login',
  loginRateLimiter,
  loginWithFacialAuth
);

/**
 * @route   POST /api/facial-auth/enable
 * @desc    Enable facial authentication for user
 * @access  Private (requires authentication)
 */
router.post('/enable', authenticate, enableFacialAuth);

/**
 * @route   POST /api/facial-auth/disable
 * @desc    Disable facial authentication for user
 * @access  Private (requires authentication)
 */
router.post('/disable', authenticate, disableFacialAuth);

export default router;
