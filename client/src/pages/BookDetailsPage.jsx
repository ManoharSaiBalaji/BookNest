import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api, { getErrorMessage } from '../services/api';
import { useCart } from '../context/CartContext';
import { FALLBACK_COVER } from '../constants/categories';

export default function BookDetailsPage() {
  const { id } = useParams();
  const { addToCart, items } = useCart();

  const [book, setBook] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    async function fetchBook() {
      setLoading(true);
      setError('');
      try {
        const { data } = await api.get(`/books/${id}`);
        setBook(data.book);
      } catch (err) {
        setError(getErrorMessage(err, 'Book not found.'));
      } finally {
        setLoading(false);
      }
    }
    fetchBook();
  }, [id]);

  if (loading) {
    return (
      <div className="container section">
        <div className="center-state">
          <div className="spinner" />
          <p>Loading book details...</p>
        </div>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="container section">
        <div className="alert alert-error">{error || 'Book not found.'}</div>
        <Link to="/books" className="btn btn-outline">
          ← Back to All Books
        </Link>
      </div>
    );
  }

  const inCartQty = items.find((i) => i.bookId === book._id)?.quantity || 0;
  const maxAddable = Math.max(0, book.stock - inCartQty);

  function handleAddToCart() {
    const result = addToCart(book, quantity);
    setFeedback(result);
  }

  return (
    <div className="container section">
      <div style={{ marginBottom: '1.25rem' }}>
        <Link to="/books" className="btn btn-outline btn-sm">
          ← Back to Books
        </Link>
      </div>

      <div className="details-grid">
        <div className="details-cover">
          <img
            src={book.coverImage || FALLBACK_COVER}
            alt={book.title}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = FALLBACK_COVER;
            }}
          />
        </div>

        <div className="card">
          <span
            className="stock-tag"
            style={{ background: '#EBF5FF', color: 'var(--primary)' }}
          >
            {book.category}
          </span>

          <h1 className="font-serif" style={{ fontSize: '2rem', marginTop: '0.75rem', marginBottom: '0.35rem' }}>
            {book.title}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', marginTop: 0 }}>
            by <strong>{book.author}</strong>
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '1.2rem 0' }}>
            <span style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--primary)' }}>
              ${Number(book.price).toFixed(2)}
            </span>
            {book.stock <= 0 ? (
              <span className="stock-tag stock-out">Out of Stock</span>
            ) : book.stock <= 5 ? (
              <span className="stock-tag stock-low">Low Stock ({book.stock} left)</span>
            ) : (
              <span className="stock-tag stock-in">{book.stock} Available</span>
            )}
          </div>

          <p style={{ lineHeight: 1.7, color: 'var(--text)' }}>{book.description}</p>

          {book.isbn && (
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              <strong>ISBN:</strong> {book.isbn}
            </p>
          )}

          {book.stock > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', marginTop: '1.5rem' }}>
              <div className="qty-stepper">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                >
                  -
                </button>
                <span>{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(Math.max(1, maxAddable), q + 1))}
                  disabled={quantity >= maxAddable}
                >
                  +
                </button>
              </div>

              <button
                type="button"
                className="btn btn-secondary"
                disabled={maxAddable <= 0}
                onClick={handleAddToCart}
              >
                {maxAddable <= 0 ? 'Maximum Stock in Cart' : 'Add to Cart'}
              </button>

              <Link to="/cart" className="btn btn-outline">
                View Cart
              </Link>
            </div>
          )}

          {inCartQty > 0 && (
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '0.8rem' }}>
              You currently have {inCartQty} {inCartQty === 1 ? 'copy' : 'copies'} in your cart.
            </p>
          )}

          {feedback && (
            <div
              className={`alert ${feedback.ok ? 'alert-success' : 'alert-error'}`}
              style={{ marginTop: '1rem', marginBottom: 0 }}
            >
              {feedback.message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
