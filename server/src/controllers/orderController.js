import mongoose from 'mongoose';
import Book from '../models/Book.js';
import Order, { ORDER_STATUSES } from '../models/Order.js';

/**
 * Restore stock quantities if checkout fails mid-way or order save fails.
 */
async function rollbackReservedStock(reservedItems) {
  await Promise.all(
    reservedItems.map((item) =>
      Book.updateOne({ _id: item.book }, { $inc: { stock: item.quantity } })
    )
  );
}

/**
 * POST /api/orders
 * Place a new Cash on Delivery order with server-side price & atomic stock validation.
 */
export async function createOrder(req, res, next) {
  const reservedItems = [];

  try {
    const { items, deliveryAddress } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Your cart is empty. Add at least one book to order.' });
    }

    const requiredAddressFields = ['fullName', 'phone', 'street', 'city', 'state', 'postalCode'];
    if (!deliveryAddress || typeof deliveryAddress !== 'object') {
      return res.status(400).json({ message: 'Delivery address is required.' });
    }

    for (const field of requiredAddressFields) {
      if (!deliveryAddress[field] || !String(deliveryAddress[field]).trim()) {
        return res.status(400).json({ message: `Delivery ${field} is required.` });
      }
    }

    // Merge duplicate book entries and validate quantities + ObjectIds
    const quantityByBookId = new Map();
    for (const rawItem of items) {
      const bookId = rawItem?.bookId || rawItem?.book;
      const quantity = Number(rawItem?.quantity);

      if (!bookId || !mongoose.Types.ObjectId.isValid(bookId)) {
        return res.status(400).json({ message: 'Invalid book ID in order items.' });
      }
      if (!Number.isInteger(quantity) || quantity < 1) {
        return res.status(400).json({ message: 'Quantity must be a positive whole number.' });
      }

      const key = String(bookId);
      quantityByBookId.set(key, (quantityByBookId.get(key) || 0) + quantity);
    }

    // Atomically decrement stock per book using conditional findOneAndUpdate
    // so concurrent orders can never oversell or push stock below zero.
    let totalAmount = 0;

    for (const [bookId, quantity] of quantityByBookId.entries()) {
      const updatedBook = await Book.findOneAndUpdate(
        { _id: bookId, stock: { $gte: quantity } },
        { $inc: { stock: -quantity } },
        { new: true }
      );

      if (!updatedBook) {
        await rollbackReservedStock(reservedItems);
        const existingBook = await Book.findById(bookId);

        if (!existingBook) {
          return res.status(404).json({
            message: 'One of the books in your cart is no longer available.',
          });
        }

        return res.status(409).json({
          message:
            existingBook.stock === 0
              ? `"${existingBook.title}" is currently out of stock.`
              : `Only ${existingBook.stock} copies of "${existingBook.title}" are available.`,
        });
      }

      // Always read price and title from database — never trust client prices
      const lineTotal = updatedBook.price * quantity;
      totalAmount += lineTotal;

      reservedItems.push({
        book: updatedBook._id,
        title: updatedBook.title,
        author: updatedBook.author,
        coverImage: updatedBook.coverImage,
        price: updatedBook.price,
        quantity,
      });
    }

    const order = await Order.create({
      user: req.user._id,
      items: reservedItems,
      totalAmount: Number(totalAmount.toFixed(2)),
      deliveryAddress: {
        fullName: String(deliveryAddress.fullName).trim(),
        phone: String(deliveryAddress.phone).trim(),
        street: String(deliveryAddress.street).trim(),
        city: String(deliveryAddress.city).trim(),
        state: String(deliveryAddress.state).trim(),
        postalCode: String(deliveryAddress.postalCode).trim(),
      },
      paymentMethod: 'Cash on Delivery',
      status: 'Pending',
    });

    res.status(201).json({
      message: 'Order placed successfully!',
      order,
    });
  } catch (error) {
    if (reservedItems.length > 0) {
      await rollbackReservedStock(reservedItems);
    }
    next(error);
  }
}

/**
 * GET /api/orders/my-orders
 * Return order history for the authenticated customer.
 */
export async function getMyOrders(req, res, next) {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ orders });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/orders
 * Return all customer orders (Admin only).
 */
export async function getAllOrders(req, res, next) {
  try {
    const { status } = req.query;
    const filter = {};

    if (status && status !== 'All' && ORDER_STATUSES.includes(status)) {
      filter.status = status;
    }

    const orders = await Order.find(filter)
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    res.json({ orders });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/orders/:id/status
 * Update order status (Admin only).
 */
export async function updateOrderStatus(req, res, next) {
  try {
    const { status } = req.body;

    if (!ORDER_STATUSES.includes(status)) {
      return res.status(400).json({
        message: `Invalid status. Must be one of: ${ORDER_STATUSES.join(', ')}`,
      });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    ).populate('user', 'name email');

    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    res.json({
      message: `Order status updated to ${status}.`,
      order,
    });
  } catch (error) {
    next(error);
  }
}
