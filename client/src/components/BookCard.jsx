import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { FALLBACK_COVER } from '../constants/categories';

export default function BookCard({ book }) {
  const { addToCart, items } = useCart();
  const [feedback, setFeedback] = useState(null);

  const inCartQty = items.find((i) => i.bookId === book._id)?.quantity || 0;
  const outOfStock = book.stock <= 0;
  const maxReached = !outOfStock && inCartQty >= book.stock;

  function handleAdd() {
    const result = addToCart(book, 1);
    setFeedback(result);
    setTimeout(() => setFeedback(null), 2200);
  }

  return (
    <article className="book-card">
      <Link to={`/books/${book._id}`} className="book-cover-wrap">
        <img
          src={book.coverImage || FALLBACK_COVER}
          alt={book.title}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = FALLBACK_COVER;
          }}
        />
        <span className="book-category-pill">{book.category}</span>
      </Link>

      <div className="book-card-body">
        <Link to={`/books/${book._id}`}>
          <h3 className="book-title">{book.title}</h3>
        </Link>
        <p className="book-author">by {book.author}</p>

        <div className="book-card-footer">
          <div className="book-price-row">
            <span className="book-price">${Number(book.price).toFixed(2)}</span>
            {outOfStock ? (
              <span className="stock-tag stock-out">Out of stock</span>
            ) : book.stock <= 5 ? (
              <span className="stock-tag stock-low">Only {book.stock} left</span>
            ) : (
              <span className="stock-tag stock-in">In stock</span>
            )}
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-block"
            disabled={outOfStock || maxReached}
            onClick={handleAdd}
          >
            {outOfStock
              ? 'Out of Stock'
              : maxReached
              ? 'Max in Cart'
              : 'Add to Cart'}
          </button>

          {feedback && (
            <small
              style={{
                color: feedback.ok ? 'var(--success)' : 'var(--error)',
                fontWeight: 600,
                textAlign: 'center',
              }}
            >
              {feedback.message}
            </small>
          )}
        </div>
      </div>
    </article>
  );
}
