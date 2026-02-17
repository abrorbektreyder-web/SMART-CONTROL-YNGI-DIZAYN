import { Router } from 'express';
import { login } from '../controllers/auth.controller';

const router = Router();

// /api/auth/login manzilini `login` controlleriga bog'laymiz
router.post('/login', login);

export default router;
