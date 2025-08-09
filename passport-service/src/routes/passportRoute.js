import express from 'express';
import { createPassport } from '../controllers/passportController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { authorizeRole } from '../middlewares/roleMiddleware.js';

const router = express.Router();

// Only admins can create
router.post('/', authenticate, authorizeRole(['admin']), createPassport);

export default router;
