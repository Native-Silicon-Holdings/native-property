import { Request, Response, NextFunction } from 'express';
import { sendBadRequest } from '../utils/response.util';
import crypto from 'crypto';
import fs from 'fs';

/**
 * Validates video file uploads for facial verification
 * Implements security checks to prevent malicious uploads
 */
export const validateVideoUpload = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const file = req.file;

  if (!file) {
    sendBadRequest(res, 'Video file is required');
    return;
  }

  try {
    // 1. Check file size (max 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      // Delete the file
      fs.unlinkSync(file.path);
      sendBadRequest(res, 'File size exceeds maximum allowed size of 50MB');
      return;
    }

    // 2. Check file size minimum (prevent empty or too small files)
    const minSize = 1024; // 1KB minimum
    if (file.size < minSize) {
      fs.unlinkSync(file.path);
      sendBadRequest(res, 'File size is too small. Please record a valid video');
      return;
    }

    // 3. Validate MIME type
    const allowedMimeTypes = ['video/mp4', 'video/webm', 'video/ogg'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      fs.unlinkSync(file.path);
      sendBadRequest(res, 'Invalid file type. Only MP4, WebM, and OGG videos are allowed');
      return;
    }

    // 4. Validate file extension
    const allowedExtensions = ['.mp4', '.webm', '.ogg'];
    const fileExtension = file.originalname.toLowerCase().slice(file.originalname.lastIndexOf('.'));
    if (!allowedExtensions.includes(fileExtension)) {
      fs.unlinkSync(file.path);
      sendBadRequest(res, 'Invalid file extension');
      return;
    }

    // 5. Check for null bytes (potential path traversal attack)
    if (file.originalname.includes('\0')) {
      fs.unlinkSync(file.path);
      sendBadRequest(res, 'Invalid filename');
      return;
    }

    // 6. Sanitize filename (prevent directory traversal)
    const sanitizedFilename = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    if (sanitizedFilename !== file.originalname) {
      console.warn('Suspicious filename detected:', file.originalname);
    }

    // 7. Calculate file hash for integrity checking
    const fileBuffer = fs.readFileSync(file.path);
    const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    // Attach hash to request for later use
    req.body.fileHash = fileHash;

    // 8. Check for duplicate uploads (optional - prevents replay attacks)
    // This could be implemented by checking if the hash already exists in the database

    // 9. Verify file is actually a video by checking magic numbers
    const magicNumbers = {
      mp4: [0x00, 0x00, 0x00],
      webm: [0x1a, 0x45, 0xdf],
      ogg: [0x4f, 0x67, 0x67],
    };

    const fileHeader = fileBuffer.slice(0, 4);
    let isValidVideo = false;

    // Check MP4
    if (file.mimetype === 'video/mp4') {
      const mp4Magic = fileBuffer.slice(4, 7);
      isValidVideo = mp4Magic[0] === 0x66 && mp4Magic[1] === 0x74 && mp4Magic[2] === 0x79; // 'fty'
    }
    // Check WebM
    else if (file.mimetype === 'video/webm') {
      isValidVideo =
        fileHeader[0] === magicNumbers.webm[0] &&
        fileHeader[1] === magicNumbers.webm[1] &&
        fileHeader[2] === magicNumbers.webm[2];
    }
    // Check OGG
    else if (file.mimetype === 'video/ogg') {
      isValidVideo =
        fileHeader[0] === magicNumbers.ogg[0] &&
        fileHeader[1] === magicNumbers.ogg[1] &&
        fileHeader[2] === magicNumbers.ogg[2];
    }

    if (!isValidVideo) {
      fs.unlinkSync(file.path);
      sendBadRequest(res, 'File does not appear to be a valid video file');
      return;
    }

    // All validations passed
    next();
  } catch (error) {
    console.error('Video validation error:', error);

    // Clean up file on error
    if (file && file.path && fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

    sendBadRequest(res, 'Failed to validate video file');
  }
};

/**
 * Sanitize verification ID parameter
 * Prevents injection attacks
 */
export const sanitizeVerificationId = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { verificationId } = req.params;

  if (!verificationId) {
    sendBadRequest(res, 'Verification ID is required');
    return;
  }

  // Validate UUID format
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (!uuidRegex.test(verificationId)) {
    sendBadRequest(res, 'Invalid verification ID format');
    return;
  }

  next();
};

/**
 * Validate email input for initialization
 * Prevents injection and ensures valid format
 */
export const validateEmailInput = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { email } = req.body;

  if (!email) {
    sendBadRequest(res, 'Email is required');
    return;
  }

  // Validate email format
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  if (!emailRegex.test(email)) {
    sendBadRequest(res, 'Invalid email format');
    return;
  }

  // Prevent email injection
  if (email.includes('\n') || email.includes('\r') || email.includes('\0')) {
    sendBadRequest(res, 'Invalid email format');
    return;
  }

  // Limit email length
  if (email.length > 255) {
    sendBadRequest(res, 'Email is too long');
    return;
  }

  // Sanitize email (trim and lowercase)
  req.body.email = email.trim().toLowerCase();

  next();
};
