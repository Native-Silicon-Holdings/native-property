import { Router } from 'express';
import { body } from 'express-validator';
import * as utilityController from '../controllers/utility.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';

const router = Router();

// All utility routes require authentication
router.use(authenticate);

// Validation rules
const addReadingValidation = [
  body('propertyId').isUUID().withMessage('Valid property ID is required'),
  body('utilityType').isIn(['WATER', 'ELECTRICITY', 'GAS']).withMessage('Valid utility type is required'),
  body('readingDate').isISO8601().withMessage('Valid reading date is required'),
  body('meterReading').isFloat({ min: 0 }).withMessage('Valid meter reading is required'),
  body('rate').isFloat({ min: 0 }).withMessage('Valid rate is required')
];

const recordPaymentValidation = [
  body('propertyId').isUUID().withMessage('Valid property ID is required'),
  body('amount').isFloat({ min: 0 }).withMessage('Valid amount is required'),
  body('paymentDate').isISO8601().withMessage('Valid payment date is required'),
  body('paymentMethod').isIn(['CASH', 'BANK_TRANSFER', 'CARD', 'CHEQUE', 'EFT'])
    .withMessage('Valid payment method is required'),
  body('reference').notEmpty().withMessage('Payment reference is required')
];

// Routes
router.get('/readings', utilityController.getUtilityReadings);
router.get('/consumption/:propertyId', utilityController.getPropertyConsumption);

router.post(
  '/readings',
  authorize('DIRECTOR', 'MANAGER', 'ACCOUNTANT'),
  validate(addReadingValidation),
  utilityController.addUtilityReading
);

router.post(
  '/readings/bulk',
  authorize('DIRECTOR', 'MANAGER', 'ACCOUNTANT'),
  utilityController.bulkImportReadings
);

router.get('/payments', utilityController.getPayments);

router.post(
  '/payments',
  authorize('DIRECTOR', 'MANAGER', 'ACCOUNTANT'),
  validate(recordPaymentValidation),
  utilityController.recordPayment
);

router.get('/billing/:propertyId', utilityController.getBillingSummary);

export default router;
