import { Router } from 'express';
import { body } from 'express-validator';
import * as votingController from '../controllers/voting.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';

const router = Router();

// All voting routes require authentication
router.use(authenticate);

// Validation rules
const castVoteValidation = [
  body('electionId').isUUID().withMessage('Valid election ID is required'),
  body('candidateId').isUUID().withMessage('Valid candidate ID is required')
];

// Routes
router.post('/cast', validate(castVoteValidation), votingController.castVote);
router.get('/status/:electionId', votingController.getVotingStatus);
router.get('/verify/:voteId', votingController.verifyVote);
router.get('/results/:electionId', votingController.getResults);
router.get('/history', votingController.getVotingHistory);

export default router;





