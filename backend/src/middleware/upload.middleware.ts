import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';

// Ensure upload directory exists
const uploadDir = process.env.UPLOAD_DIR || './uploads';
const documentsDir = path.join(uploadDir, 'documents');
const photosDir = path.join(uploadDir, 'photos');
const receiptsDir = path.join(uploadDir, 'receipts');

[uploadDir, documentsDir, photosDir, receiptsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure storage
const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    let destDir = uploadDir;

    // Determine destination based on field name
    if (file.fieldname === 'document') {
      destDir = documentsDir;
    } else if (file.fieldname === 'photo' || file.fieldname === 'photos') {
      destDir = photosDir;
    } else if (file.fieldname === 'receipt') {
      destDir = receiptsDir;
    }

    cb(null, destDir);
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext).replace(/\s+/g, '-');
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  }
});

// File filter for documents
const documentFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, DOC, DOCX, XLS, and XLSX files are allowed.'));
  }
};

// File filter for images
const imageFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and GIF images are allowed.'));
  }
};

// File size limit (10MB by default)
const maxFileSize = parseInt(process.env.MAX_FILE_SIZE || '10485760');

// Export upload configurations
export const uploadDocument = multer({
  storage,
  fileFilter: documentFilter,
  limits: { fileSize: maxFileSize }
});

export const uploadImage = multer({
  storage,
  fileFilter: imageFilter,
  limits: { fileSize: maxFileSize }
});

export const uploadAny = multer({
  storage,
  limits: { fileSize: maxFileSize }
});
