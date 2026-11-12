import Book, { BOOK_CATEGORIES } from '../models/Book.js';

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * GET /api/books
 * Browse, search (title/author), filter by category, and sort books.
 */
export async function getBooks(req, res, next) {
  try {
    const { search = '', category = '', sort = 'newest', page, limit } = req.query;
    const filter = {};

    if (search && search.trim()) {
      const pattern = new RegExp(escapeRegex(search.trim()), 'i');
      filter.$or = [{ title: pattern }, { author: pattern }];
    }

    if (category && category.trim() && category.trim().toLowerCase() !== 'all') {
      const matchedCategory = BOOK_CATEGORIES.find(
        (c) => c.toLowerCase() === category.trim().toLowerCase()
      );
      filter.category = matchedCategory || category.trim();
    }

    const sortOptions = {
      newest: { createdAt: -1 },
      price_asc: { price: 1 },
      price_desc: { price: -1 },
      title_asc: { title: 1 },
    };
    const sortBy = sortOptions[sort] || sortOptions.newest;

    const total = await Book.countDocuments(filter);
    let query = Book.find(filter).sort(sortBy);

    if (page || limit) {
      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 12));
      query = query.skip((pageNum - 1) * limitNum).limit(limitNum);
    }

    const books = await query;
    res.json({
      books,
      total,
      categories: BOOK_CATEGORIES,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/books/:id
 * Fetch details for a single book.
 */
export async function getBookById(req, res, next) {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: 'Book not found.' });
    }
    res.json({ book });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/books
 * Create a new book (Admin only).
 */
export async function createBook(req, res, next) {
  try {
    const { title, author, category, description, price, stock, coverImage, isbn } = req.body;

    const parsedPrice = Number(price);
    const parsedStock = Number(stock);

    if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
      return res.status(400).json({ message: 'Price must be a valid non-negative number.' });
    }
    if (!Number.isInteger(parsedStock) || parsedStock < 0) {
      return res.status(400).json({ message: 'Stock must be a non-negative whole number.' });
    }

    const book = await Book.create({
      title,
      author,
      category,
      description,
      price: Number(parsedPrice.toFixed(2)),
      stock: parsedStock,
      coverImage: coverImage || '',
      isbn: isbn || '',
    });

    res.status(201).json({
      message: 'Book added successfully.',
      book,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/books/:id
 * Update an existing book or its stock quantity (Admin only).
 */
export async function updateBook(req, res, next) {
  try {
    const allowedFields = [
      'title',
      'author',
      'category',
      'description',
      'price',
      'stock',
      'coverImage',
      'isbn',
    ];
    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (updates.price !== undefined) {
      const parsedPrice = Number(updates.price);
      if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
        return res.status(400).json({ message: 'Price must be a valid non-negative number.' });
      }
      updates.price = Number(parsedPrice.toFixed(2));
    }

    if (updates.stock !== undefined) {
      const parsedStock = Number(updates.stock);
      if (!Number.isInteger(parsedStock) || parsedStock < 0) {
        return res.status(400).json({ message: 'Stock must be a non-negative whole number.' });
      }
      updates.stock = parsedStock;
    }

    const book = await Book.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!book) {
      return res.status(404).json({ message: 'Book not found.' });
    }

    res.json({
      message: 'Book updated successfully.',
      book,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/books/:id
 * Delete a book from the catalog (Admin only).
 */
export async function deleteBook(req, res, next) {
  try {
    const book = await Book.findByIdAndDelete(req.params.id);
    if (!book) {
      return res.status(404).json({ message: 'Book not found.' });
    }

    res.json({ message: 'Book deleted successfully.' });
  } catch (error) {
    next(error);
  }
}
