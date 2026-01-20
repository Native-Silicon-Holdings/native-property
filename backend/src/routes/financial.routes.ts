import { Router } from 'express';
import { body } from 'express-validator';
import * as financialController from '../controllers/financial.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';

const router = Router();

// All financial routes require authentication and specific roles
router.use(authenticate);
router.use(authorize('DIRECTOR', 'MANAGER', 'ACCOUNTANT'));

// Validation rules
const createTransactionValidation = [
  body('date').isISO8601().withMessage('Valid date is required'),
  body('type').isIn(['INCOME', 'EXPENSE']).withMessage('Valid transaction type is required'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('amount').isFloat({ min: 0 }).withMessage('Valid amount is required')
];

const createBudgetValidation = [
  body('fiscalYear').isInt({ min: 2000, max: 2100 }).withMessage('Valid fiscal year is required'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('budgetedAmount').isFloat({ min: 0 }).withMessage('Valid budgeted amount is required')
];

// Routes
router.get('/overview', financialController.getOverview);
router.post('/transactions', validate(createTransactionValidation), financialController.createTransaction);
router.get('/budget', financialController.getBudget);
router.post('/budget', validate(createBudgetValidation), financialController.createBudget);
router.put('/budget/:id', financialController.updateBudget);

export default router;





