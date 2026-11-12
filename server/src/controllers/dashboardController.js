import Book from '../models/Book.js';
import Order from '../models/Order.js';
import User from '../models/User.js';

const LOW_STOCK_THRESHOLD = 5;

/**
 * GET /api/dashboard/stats
 * Summary metrics and low-stock alert books for Admin Dashboard.
 */
export async function getDashboardStats(req, res, next) {
  try {
    const [
      totalBooks,
      totalOrders,
      totalCustomers,
      lowStockBooks,
      recentOrders,
      revenueResult,
    ] = await Promise.all([
      Book.countDocuments(),
      Order.countDocuments(),
      User.countDocuments({ role: 'customer' }),
      Book.find({ stock: { $lte: LOW_STOCK_THRESHOLD } })
        .sort({ stock: 1, title: 1 })
        .select('title author category stock price'),
      Order.find()
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .limit(5),
      Order.aggregate([
        { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } },
      ]),
    ]);

    const totalRevenue = revenueResult[0]?.totalRevenue || 0;

    res.json({
      stats: {
        totalBooks,
        totalOrders,
        totalCustomers,
        totalRevenue: Number(totalRevenue.toFixed(2)),
        lowStockCount: lowStockBooks.length,
      },
      lowStockBooks,
      recentOrders,
    });
  } catch (error) {
    next(error);
  }
}
