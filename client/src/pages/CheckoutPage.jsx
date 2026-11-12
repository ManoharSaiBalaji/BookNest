import { useState } from 'react';
import { Link } from 'react-router-dom';
import api, { getErrorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import StatusBadge from '../components/StatusBadge';

export default function CheckoutPage() {
  const { user } = useAuth();
  const { items, subtotal, clearCart } = useCart();

  const [fullName, setFullName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [street, setStreet] = useState(user?.address?.street || '');
  const [city, setCity] = useState(user?.address?.city || '');
  const [state, setState] = useState(user?.address?.state || '');
  const [postalCode, setPostalCode] = useState(user?.address?.postalCode || '');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [placedOrder, setPlacedOrder] = useState(null);

  if (placedOrder) {
    return (
      <div className="container section">
        <div className="card" style={{ maxWidth: '720px', margin: '0 auto' }}>
          <div className="alert alert-success">
            Order placed successfully! Your order is confirmed for Cash on Delivery.
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h1 className="font-serif" style={{ fontSize: '1.65rem', marginBottom: 0 }}>
              Order Summary
            </h1>
            <StatusBadge status={placedOrder.status} />
          </div>

          <p style={{ color: 'var(--text-muted)', marginTop: '0.35rem' }}>
            Order ID: <strong>{placedOrder._id}</strong>
          </p>

          <div style={{ margin: '1rem 0', padding: '0.9rem', background: 'var(--bg)', borderRadius: '8px' }}>
            <strong>Deliver To:</strong>
            <div>{placedOrder.deliveryAddress.fullName} ({placedOrder.deliveryAddress.phone})</div>
            <div>
              {placedOrder.deliveryAddress.street}, {placedOrder.deliveryAddress.city},{' '}
              {placedOrder.deliveryAddress.state} {placedOrder.deliveryAddress.postalCode}
            </div>
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Book</th>
                  <th>Price</th>
                  <th>Qty</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {placedOrder.items.map((item) => (
                  <tr key={item.book}>
                    <td>{item.title}</td>
                    <td>${Number(item.price).toFixed(2)}</td>
                    <td>{item.quantity}</td>
                    <td>${(item.price * item.quantity).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="summary-total" style={{ marginBottom: '1.25rem' }}>
            <span>Total Due on Delivery</span>
            <span>${Number(placedOrder.totalAmount).toFixed(2)}</span>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Link to="/orders" className="btn btn-primary">
              View My Orders
            </Link>
            <Link to="/books" className="btn btn-outline">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container section">
        <div className="center-state">
          <h2>Your cart is empty</h2>
          <p style={{ color: 'var(--text-muted)' }}>
            Add books to your cart before proceeding to checkout.
          </p>
          <Link to="/books" className="btn btn-primary">
            Browse Books
          </Link>
        </div>
      </div>
    );
  }

  async function handlePlaceOrder(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const payload = {
        items: items.map((item) => ({
          bookId: item.bookId,
          quantity: item.quantity,
        })),
        deliveryAddress: {
          fullName: fullName.trim(),
          phone: phone.trim(),
          street: street.trim(),
          city: city.trim(),
          state: state.trim(),
          postalCode: postalCode.trim(),
        },
      };

      const { data } = await api.post('/orders', payload);
      clearCart();
      setPlacedOrder(data.order);
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to place order. Please check stock availability.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container section">
      <div className="section-header">
        <div>
          <h1 className="section-title">Checkout</h1>
          <p className="section-subtitle">Cash on Delivery — pay when your books arrive</p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="two-col-layout">
        <form className="card" onSubmit={handlePlaceOrder}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Delivery Address</h2>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="co-name">
                Full Name
              </label>
              <input
                id="co-name"
                type="text"
                className="form-control"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="co-phone">
                Phone Number
              </label>
              <input
                id="co-phone"
                type="tel"
                className="form-control"
                placeholder="e.g. 555-0199"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="co-street">
              Street Address
            </label>
            <input
              id="co-street"
              type="text"
              className="form-control"
              placeholder="House / Apt, Street name"
              value={street}
              onChange={(e) => setStreet(e.target.value)}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="co-city">
                City
              </label>
              <input
                id="co-city"
                type="text"
                className="form-control"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="co-state">
                State / Province
              </label>
              <input
                id="co-state"
                type="text"
                className="form-control"
                value={state}
                onChange={(e) => setState(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="co-zip">
              Postal Code
            </label>
            <input
              id="co-zip"
              type="text"
              className="form-control"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              required
            />
          </div>

          <div className="alert alert-info">
            Payment Method: <strong>Cash on Delivery (COD)</strong>. Prices and stock are
            verified on the server when placing your order.
          </div>

          <button
            type="submit"
            className="btn btn-accent btn-block"
            disabled={submitting}
          >
            {submitting ? 'Placing Order...' : `Place Order ($${subtotal.toFixed(2)})`}
          </button>
        </form>

        <aside className="card">
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Items in Order</h2>
          {items.map((item) => (
            <div
              key={item.bookId}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: '0.75rem',
                paddingBottom: '0.7rem',
                marginBottom: '0.7rem',
                borderBottom: '1px solid var(--border)',
                fontSize: '0.92rem',
              }}
            >
              <div>
                <div style={{ fontWeight: 600 }}>{item.title}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                  Qty: {item.quantity} × ${Number(item.price).toFixed(2)}
                </div>
              </div>
              <strong>${(item.price * item.quantity).toFixed(2)}</strong>
            </div>
          ))}

          <div className="summary-total">
            <span>Total</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
        </aside>
      </div>
    </div>
  );
}
