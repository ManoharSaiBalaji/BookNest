import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { FALLBACK_COVER } from '../constants/categories';

export default function CartPage() {
  const { items, itemCount, subtotal, updateQuantity, removeFromCart } = useCart();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="container section">
        <div className="center-state">
          <h1 className="font-serif" style={{ fontSize: '1.8rem' }}>
            Your Shopping Cart is Empty
          </h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            Explore our collection and add some books to get started.
          </p>
          <Link to="/books" className="btn btn-primary">
            Browse Books
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container section">
      <div className="section-header">
        <div>
          <h1 className="section-title">Shopping Cart</h1>
          <p className="section-subtitle">
            {itemCount} {itemCount === 1 ? 'book' : 'books'} in your cart
          </p>
        </div>
        <Link to="/books" className="btn btn-outline btn-sm">
          Continue Shopping
        </Link>
      </div>

      <div className="two-col-layout">
        <div className="card">
          {items.map((item) => (
            <div key={item.bookId} className="cart-item">
              <img
                src={item.coverImage || FALLBACK_COVER}
                alt={item.title}
                className="cart-thumb"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = FALLBACK_COVER;
                }}
              />

              <div style={{ flex: 1, minWidth: '180px' }}>
                <Link
                  to={`/books/${item.bookId}`}
                  style={{ fontWeight: 700, color: 'var(--primary)' }}
                >
                  {item.title}
                </Link>
                <div style={{ fontSize: '0.86rem', color: 'var(--text-muted)' }}>
                  by {item.author}
                </div>
                <div style={{ fontSize: '0.9rem', marginTop: '0.35rem', fontWeight: 600 }}>
                  ${Number(item.price).toFixed(2)} each
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Stock limit: {item.stock}
                </div>
              </div>

              <div className="qty-stepper">
                <button
                  type="button"
                  onClick={() => updateQuantity(item.bookId, item.quantity - 1)}
                  aria-label="Decrease quantity"
                >
                  -
                </button>
                <span>{item.quantity}</span>
                <button
                  type="button"
                  disabled={item.quantity >= item.stock}
                  onClick={() => updateQuantity(item.bookId, item.quantity + 1)}
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>

              <div style={{ minWidth: '85px', textAlign: 'right', fontWeight: 700 }}>
                ${(item.price * item.quantity).toFixed(2)}
              </div>

              <button
                type="button"
                className="btn btn-outline btn-sm"
                style={{ color: 'var(--error)', borderColor: '#FECACA' }}
                onClick={() => removeFromCart(item.bookId)}
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        <aside className="card">
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Order Summary</h2>
          <div className="summary-row">
            <span>Subtotal ({itemCount} items)</span>
            <strong>${subtotal.toFixed(2)}</strong>
          </div>
          <div className="summary-row">
            <span>Delivery</span>
            <span style={{ color: 'var(--success)', fontWeight: 600 }}>Free</span>
          </div>
          <div className="summary-row">
            <span>Payment Method</span>
            <span>Cash on Delivery</span>
          </div>
          <div className="summary-total">
            <span>Total</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>

          <button
            type="button"
            className="btn btn-accent btn-block"
            style={{ marginTop: '1.2rem' }}
            onClick={() => navigate('/checkout')}
          >
            Proceed to Checkout
          </button>
        </aside>
      </div>
    </div>
  );
}
