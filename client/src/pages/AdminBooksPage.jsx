import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { getErrorMessage } from '../services/api';
import ConfirmModal from '../components/ConfirmModal';
import { FALLBACK_COVER } from '../constants/categories';

export default function AdminBooksPage() {
  const [books, setBooks] = useState([]);
  const [stockDrafts, setStockDrafts] = useState({});
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  async function loadBooks(searchQuery = '') {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (searchQuery.trim()) params.search = searchQuery.trim();
      const { data } = await api.get('/books', { params });
      setBooks(data.books);
      const drafts = {};
      data.books.forEach((b) => {
        drafts[b._id] = String(b.stock);
      });
      setStockDrafts(drafts);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to fetch books.'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      loadBooks(search);
    }, 180);
    return () => clearTimeout(timer);
  }, [search]);

  async function handleQuickStockUpdate(book) {
    const nextStock = Number(stockDrafts[book._id]);
    if (!Number.isInteger(nextStock) || nextStock < 0) {
      setError('Stock must be a non-negative whole number.');
      return;
    }

    setError('');
    setFeedback('');
    try {
      const { data } = await api.put(`/books/${book._id}`, { stock: nextStock });
      setBooks((prev) => prev.map((b) => (b._id === book._id ? data.book : b)));
      setFeedback(`Updated stock for "${book.title}" to ${nextStock}.`);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to update stock.'));
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setError('');
    setFeedback('');
    try {
      await api.delete(`/books/${deleteTarget._id}`);
      setBooks((prev) => prev.filter((b) => b._id !== deleteTarget._id));
      setFeedback(`Deleted "${deleteTarget.title}".`);
      setDeleteTarget(null);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to delete book.'));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="container section">
      <div className="section-header">
        <div>
          <h1 className="section-title">Manage Books</h1>
          <p className="section-subtitle">
            Add, edit, delete books, or update inventory stock quantities
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <Link to="/admin" className="btn btn-outline btn-sm">
            ← Dashboard
          </Link>
          <Link to="/admin/books/new" className="btn btn-accent btn-sm">
            + Add New Book
          </Link>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1.2rem' }}>
        <input
          type="search"
          className="form-control"
          placeholder="Search inventory by title or author..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {feedback && <div className="alert alert-success">{feedback}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="center-state">
          <div className="spinner" />
          <p>Loading books...</p>
        </div>
      ) : books.length === 0 ? (
        <div className="center-state">
          <h3>No books found</h3>
          <Link to="/admin/books/new" className="btn btn-primary">
            Add First Book
          </Link>
        </div>
      ) : (
        <div className="card table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Book</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock Quantity</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {books.map((book) => (
                <tr key={book._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <img
                        src={book.coverImage || FALLBACK_COVER}
                        alt={book.title}
                        style={{ width: '40px', height: '54px', objectFit: 'cover', borderRadius: '4px' }}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = FALLBACK_COVER;
                        }}
                      />
                      <div>
                        <div style={{ fontWeight: 600 }}>{book.title}</div>
                        <small style={{ color: 'var(--text-muted)' }}>{book.author}</small>
                      </div>
                    </div>
                  </td>
                  <td>{book.category}</td>
                  <td>${Number(book.price).toFixed(2)}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        className="form-control"
                        style={{ width: '84px', padding: '0.35rem 0.5rem' }}
                        value={stockDrafts[book._id] ?? book.stock}
                        onChange={(e) =>
                          setStockDrafts((prev) => ({
                            ...prev,
                            [book._id]: e.target.value,
                          }))
                        }
                        aria-label={`Stock for ${book.title}`}
                      />
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleQuickStockUpdate(book)}
                      >
                        Save
                      </button>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.45rem' }}>
                      <Link
                        to={`/admin/books/${book._id}/edit`}
                        className="btn btn-outline btn-sm"
                      >
                        Edit
                      </Link>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => setDeleteTarget(book)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Delete Book"
        message={
          deleteTarget
            ? `Are you sure you want to permanently delete "${deleteTarget.title}"?`
            : ''
        }
        confirmLabel="Delete Book"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}
