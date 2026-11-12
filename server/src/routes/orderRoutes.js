import { Router } from 'express';
import {
  createOrder,
  getAllOrders,
  getMyOrders,
  updateOrderStatus,
} from '../controllers/orderController.js';
import { protect, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.post('/', protect, createOrder);
router.get('/my-orders', protect, getMyOrders);
router.get('/', protect, requireAdmin, getAllOrders);
router.patch('/:id/status', protect, requireAdmin, updateOrderStatus);

export default router;
