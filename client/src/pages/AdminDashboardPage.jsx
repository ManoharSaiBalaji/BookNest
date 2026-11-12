import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { getErrorMessage } from '../services/api';
import StatusBadge from '../components/StatusBadge';

export default function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await api.get('/dashboard/stats');
        setData(res.data);
      } catch (err) {
        setError(getErrorMessage(err, 'Failed to load dashboard statistics.'));
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="container section">
        <div className="center-state">
          <div className="spinner" />
          <p>Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container section">
        <div className="alert alert-error">{error}</div>
      </div>
    );
  }

  const { stats, lowStockBooks, recentOrders } = data;

  return (
    <div className="container section">
      <div className="section-header">
        <div>
          <h1 className="section-title">Admin Dashboard</h1>
          <p className="section-subtitle">
            Monitor store inventory, customer counts, and order fulfillment
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
          <Link to="/admin/books/new" className="btn btn-accent btn-sm">
            + Add New Book
          </Link>
          <Link to="/admin/books" className="btn btn-primary btn-sm">
            Manage Books
          </Link>
          <Link to="/admin/orders" className="btn btn-secondary btn-sm">
            Manage Orders
          </Link>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card navy">
          <div className="stat-label">Total Books</div>
          <div className="stat-value">{stats.totalBooks}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Orders</div>
          <div className="stat-value">{stats.totalOrders}</div>
        </div>
        <div className="stat-card amber">
          <div className="stat-label">Total Customers</div>
          <div className="stat-value">{stats.totalCustomers}</div>
        </div>
        <div className="stat-card green">
          <div className="stat-label">Low-Stock Books (≤ 5)</div>
          <div className="stat-value">{stats.lowStockCount}</div>
        </div>
      </div>

      <div className="two-col-layout">
        <section className="card">
          <div className="section-header" style={{ marginBottom: '0.85rem' }}>
            <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Low-Stock Alerts</h2>
            <Link to="/admin/books" className="btn btn-outline btn-sm">
              Update Stock
            </Link>
          </div>

          {lowStockBooks.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>
              All books are well-stocked right now.
            </p>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Stock</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockBooks.map((book) => (
                    <tr key={book._id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{book.title}</div>
                        <small style={{ color: 'var(--text-muted)' }}>{book.author}</small>
                      </td>
                      <td>{book.category}</td>
                      <td>
                        <span className={`stock-tag ${book.stock === 0 ? 'stock-out' : 'stock-low'}`}>
                          {book.stock} left
                        </span>
                      </td>
                      <td>
                        <Link
                          to={`/admin/books/${book._id}/edit`}
                          className="btn btn-outline btn-sm"
                        >
                          Edit
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="card">
          <div className="section-header" style={{ marginBottom: '0.85rem' }}>
            <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Recent Orders</h2>
            <Link to="/admin/orders" className="btn btn-outline btn-sm">
              All Orders
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>
              No customer orders yet.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {recentOrders.map((order) => (
                <div
                  key={order._id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingBottom: '0.7rem',
                    borderBottom: '1px solid var(--border)',
                    gap: '0.5rem',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>
                      {order.user?.name || order.deliveryAddress.fullName}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      #{order._id.slice(-6).toUpperCase()} · ${Number(order.totalAmount).toFixed(2)}
                    </div>
                  </div>
                  <StatusBadge status={order.status} />
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
