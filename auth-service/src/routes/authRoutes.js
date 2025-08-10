// external dependencies
import express from 'express';

// internal dependencies
import { register, login, introspect } from '../controllers/authController.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/introspect', introspect);

export default router;
