import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { getErrorMessage } from '../services/api';
import StatusBadge from '../components/StatusBadge';

export default function MyOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchOrders() {
      try {
        const { data } = await api.get('/orders/my-orders');
        setOrders(data.orders);
      } catch (err) {
        setError(getErrorMessage(err, 'Failed to load your orders.'));
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, []);

  return (
    <div className="container section">
      <div className="section-header">
        <div>
          <h1 className="section-title">My Orders</h1>
          <p className="section-subtitle">Track the status of your past and current book orders</p>
        </div>
        <Link to="/books" className="btn btn-outline btn-sm">
          Browse More Books
        </Link>
      </div>

      {loading ? (
        <div className="center-state">
          <div className="spinner" />
          <p>Loading your order history...</p>
        </div>
      ) : error ? (
        <div className="alert alert-error">{error}</div>
      ) : orders.length === 0 ? (
        <div className="center-state">
          <h3>No orders placed yet</h3>
          <p style={{ color: 'var(--text-muted)' }}>
            Once you place an order, it will appear here with live status updates.
          </p>
          <Link to="/books" className="btn btn-primary">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          {orders.map((order) => (
            <article key={order._id} className="card">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                  paddingBottom: '0.85rem',
                  borderBottom: '1px solid var(--border)',
                  marginBottom: '0.85rem',
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--primary)' }}>
                    Order #{order._id.slice(-8).toUpperCase()}
                  </div>
                  <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                    Placed on {new Date(order.createdAt).toLocaleDateString()} · {order.paymentMethod}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
                  <StatusBadge status={order.status} />
                  <strong style={{ fontSize: '1.08rem', color: 'var(--primary)' }}>
                    ${Number(order.totalAmount).toFixed(2)}
                  </strong>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                {order.items.map((item, idx) => (
                  <div
                    key={`${order._id}-${idx}`}
                    style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.92rem' }}
                  >
                    <span>
                      {item.title} × {item.quantity}
                    </span>
                    <span>${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div
                style={{
                  marginTop: '0.85rem',
                  paddingTop: '0.75rem',
                  borderTop: '1px dashed var(--border)',
                  fontSize: '0.85rem',
                  color: 'var(--text-muted)',
                }}
              >
                Delivery Address: {order.deliveryAddress.fullName}, {order.deliveryAddress.street},{' '}
                {order.deliveryAddress.city}, {order.deliveryAddress.state}{' '}
                {order.deliveryAddress.postalCode} ({order.deliveryAddress.phone})
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
