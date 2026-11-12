import { Router } from 'express';
import { getDashboardStats } from '../controllers/dashboardController.js';
import { protect, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/stats', protect, requireAdmin, getDashboardStats);

export default router;
