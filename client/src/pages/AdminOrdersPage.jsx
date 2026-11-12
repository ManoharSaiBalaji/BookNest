import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { getErrorMessage } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import { ORDER_STATUSES } from '../constants/categories';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');

  async function fetchOrders(filter = 'All') {
    setLoading(true);
    setError('');
    try {
      const params = filter !== 'All' ? { status: filter } : {};
      const { data } = await api.get('/orders', { params });
      setOrders(data.orders);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to fetch orders.'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchOrders(statusFilter);
  }, [statusFilter]);

  async function handleStatusChange(orderId, nextStatus) {
    setError('');
    setFeedback('');
    try {
      const { data } = await api.patch(`/orders/${orderId}/status`, {
        status: nextStatus,
      });
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? data.order : o))
      );
      setFeedback(`Order #${orderId.slice(-6).toUpperCase()} updated to ${nextStatus}.`);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to update order status.'));
    }
  }

  return (
    <div className="container section">
      <div className="section-header">
        <div>
          <h1 className="section-title">Manage Orders</h1>
          <p className="section-subtitle">
            Review customer orders and update fulfillment status
          </p>
        </div>
        <Link to="/admin" className="btn btn-outline btn-sm">
          ← Dashboard
        </Link>
      </div>

      <div className="card" style={{ marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <label className="form-label" htmlFor="order-status-filter" style={{ margin: 0 }}>
          Filter by Status:
        </label>
        <select
          id="order-status-filter"
          className="form-control"
          style={{ maxWidth: '220px' }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="All">All Orders</option>
          {ORDER_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      {feedback && <div className="alert alert-success">{feedback}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="center-state">
          <div className="spinner" />
          <p>Loading customer orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="center-state">
          <h3>No orders found</h3>
          <p style={{ color: 'var(--text-muted)' }}>
            No orders match the selected filter.
          </p>
        </div>
      ) : (
        <div className="card table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Update Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order._id}>
                  <td>
                    <div style={{ fontWeight: 700 }}>
                      #{order._id.slice(-8).toUpperCase()}
                    </div>
                    <small style={{ color: 'var(--text-muted)' }}>
                      {new Date(order.createdAt).toLocaleDateString()}
                    </small>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>
                      {order.user?.name || order.deliveryAddress.fullName}
                    </div>
                    <small style={{ color: 'var(--text-muted)' }}>
                      {order.user?.email || order.deliveryAddress.phone}
                    </small>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {order.deliveryAddress.city}, {order.deliveryAddress.state}
                    </div>
                  </td>
                  <td>
                    {order.items.map((item, idx) => (
                      <div key={idx} style={{ fontSize: '0.86rem' }}>
                        {item.title} × {item.quantity}
                      </div>
                    ))}
                  </td>
                  <td>
                    <strong>${Number(order.totalAmount).toFixed(2)}</strong>
                  </td>
                  <td>
                    <StatusBadge status={order.status} />
                  </td>
                  <td>
                    <select
                      className="form-control"
                      style={{ minWidth: '140px', padding: '0.4rem 0.6rem' }}
                      value={order.status}
                      onChange={(e) => handleStatusChange(order._id, e.target.value)}
                      aria-label={`Status for order ${order._id}`}
                    >
                      {ORDER_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
