import { Router } from 'express';
import {
  createBook,
  deleteBook,
  getBookById,
  getBooks,
  updateBook,
} from '../controllers/bookController.js';
import { protect, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/', getBooks);
router.get('/:id', getBookById);
router.post('/', protect, requireAdmin, createBook);
router.put('/:id', protect, requireAdmin, updateBook);
router.delete('/:id', protect, requireAdmin, deleteBook);

export default router;
