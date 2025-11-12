import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {
  initializeFacialVerification,
  uploadVerificationVideo,
  getVerificationStatus,
  loginWithFacialAuth,
  enableFacialAuth,
  disableFacialAuth,
} from '../controllers/facial-auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Configure multer for video uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/facial-verifications');
    // Ensure directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `facial-${uniqueSuffix}${path.extname(file.originalname)}`);
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
 */
router.post('/initialize', initializeFacialVerification);

/**
 * @route   POST /api/facial-auth/upload/:verificationId
 * @desc    Upload verification video
 * @access  Public
 */
router.post('/upload/:verificationId', upload.single('video'), uploadVerificationVideo);

/**
 * @route   GET /api/facial-auth/status/:verificationId
 * @desc    Get verification status
 * @access  Public
 */
router.get('/status/:verificationId', getVerificationStatus);

/**
 * @route   POST /api/facial-auth/login
 * @desc    Login with facial verification
 * @access  Public
 */
router.post('/login', loginWithFacialAuth);

/**
 * @route   POST /api/facial-auth/enable
 * @desc    Enable facial authentication for user
 * @access  Private
 */
router.post('/enable', authenticate, enableFacialAuth);

/**
 * @route   POST /api/facial-auth/disable
 * @desc    Disable facial authentication for user
 * @access  Private
 */
router.post('/disable', authenticate, disableFacialAuth);

export default router;
