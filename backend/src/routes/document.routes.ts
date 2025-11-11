import { Router } from 'express';
import { body } from 'express-validator';
import * as documentController from '../controllers/document.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { uploadDocument } from '../middleware/upload.middleware';
import { validate } from '../middleware/validation.middleware';

const router = Router();

// All document routes require authentication
router.use(authenticate);

// Validation rules
const uploadValidation = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('category').isIn(['AGM_MINUTES', 'FINANCIAL_REPORTS', 'RULES_REGULATIONS', 'CONTRACTS', 'POLICIES', 'OTHER'])
    .withMessage('Valid category is required')
];

// Routes
router.get('/', documentController.getDocuments);
router.get('/:id', documentController.getDocumentById);

router.post(
  '/',
  authorize('DIRECTOR', 'MANAGER'),
  uploadDocument.single('document'),
  validate(uploadValidation),
  documentController.uploadDocument
);

router.put(
  '/:id',
  authorize('DIRECTOR', 'MANAGER'),
  documentController.updateDocument
);

router.post(
  '/:id/version',
  authorize('DIRECTOR', 'MANAGER'),
  uploadDocument.single('document'),
  documentController.uploadDocumentVersion
);

router.delete(
  '/:id',
  authorize('DIRECTOR'),
  documentController.deleteDocument
);

export default router;
