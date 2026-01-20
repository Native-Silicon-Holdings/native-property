import { Router } from 'express';
import { body } from 'express-validator';
import * as propertyController from '../controllers/property.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';

const router = Router();

// All property routes require authentication
router.use(authenticate);

// Validation rules
const createValidation = [
  body('unitNumber').trim().notEmpty().withMessage('Unit number is required'),
  body('address').trim().notEmpty().withMessage('Address is required'),
  body('propertyType').isIn(['HOUSE', 'APARTMENT', 'TOWNHOUSE', 'COMMERCIAL'])
    .withMessage('Valid property type is required'),
  body('squareMeters').isFloat({ min: 0 }).withMessage('Valid square meters is required')
];

// Routes
router.get('/my-properties', propertyController.getMyProperties);
router.get('/', propertyController.getProperties);
router.get('/:id', propertyController.getPropertyById);
router.get('/:id/history', propertyController.getPropertyHistory);
router.get('/:id/owners', propertyController.getPropertyOwners);
router.get('/:id/access-requests', propertyController.getAccessRequests);

router.post(
  '/',
  authorize('DIRECTOR', 'MANAGER'),
  validate(createValidation),
  propertyController.createProperty
);

router.post(
  '/:id/transfer',
  propertyController.initiateTransfer
);

router.put(
  '/:id',
  authorize('DIRECTOR', 'MANAGER'),
  propertyController.updateProperty
);

router.put(
  '/access-requests/:requestId/approve',
  authorize('DIRECTOR', 'MANAGER'),
  propertyController.approveAccessRequest
);

router.delete(
  '/:id',
  authorize('DIRECTOR'),
  propertyController.deleteProperty
);

export default router;
