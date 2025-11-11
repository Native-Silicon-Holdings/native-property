import { Router } from 'express';
import { body } from 'express-validator';
import * as maintenanceController from '../controllers/maintenance.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { uploadImage } from '../middleware/upload.middleware';
import { validate } from '../middleware/validation.middleware';

const router = Router();

// All maintenance routes require authentication
router.use(authenticate);

// Validation rules
const createValidation = [
  body('propertyId').isUUID().withMessage('Valid property ID is required'),
  body('category').isIn(['PLUMBING', 'ELECTRICAL', 'SECURITY', 'GARDEN', 'CLEANING', 'STRUCTURAL', 'OTHER'])
    .withMessage('Valid category is required'),
  body('priority').isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).withMessage('Valid priority is required'),
  body('description').trim().notEmpty().withMessage('Description is required')
];

const feedbackValidation = [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('feedback').optional().trim()
];

// Routes
router.get('/', maintenanceController.getMaintenanceRequests);
router.get('/:id', maintenanceController.getMaintenanceRequestById);

router.post(
  '/',
  uploadImage.array('photos', 5),
  validate(createValidation),
  maintenanceController.createMaintenanceRequest
);

router.put(
  '/:id',
  authorize('DIRECTOR', 'MANAGER'),
  maintenanceController.updateMaintenanceRequest
);

router.post(
  '/:id/feedback',
  validate(feedbackValidation),
  maintenanceController.addFeedback
);

router.delete(
  '/:id',
  authorize('DIRECTOR', 'MANAGER'),
  maintenanceController.deleteMaintenanceRequest
);

export default router;
