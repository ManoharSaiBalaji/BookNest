import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api, { getErrorMessage } from '../services/api';
import { BOOK_CATEGORIES, FALLBACK_COVER } from '../constants/categories';

export default function AdminBookFormPage() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [category, setCategory] = useState(BOOK_CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [isbn, setIsbn] = useState('');

  const [loading, setLoading] = useState(isEditing);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEditing) return;

    async function fetchBook() {
      try {
        const { data } = await api.get(`/books/${id}`);
        const b = data.book;
        setTitle(b.title || '');
        setAuthor(b.author || '');
        setCategory(b.category || BOOK_CATEGORIES[0]);
        setDescription(b.description || '');
        setPrice(String(b.price ?? ''));
        setStock(String(b.stock ?? ''));
        setCoverImage(b.coverImage || '');
        setIsbn(b.isbn || '');
      } catch (err) {
        setError(getErrorMessage(err, 'Unable to load book details.'));
      } finally {
        setLoading(false);
      }
    }

    fetchBook();
  }, [id, isEditing]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    const parsedPrice = Number(price);
    const parsedStock = Number(stock);

    if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
      setError('Price must be a valid non-negative number.');
      return;
    }
    if (!Number.isInteger(parsedStock) || parsedStock < 0) {
      setError('Stock must be a non-negative whole number.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        author: author.trim(),
        category,
        description: description.trim(),
        price: parsedPrice,
        stock: parsedStock,
        coverImage: coverImage.trim(),
        isbn: isbn.trim(),
      };

      if (isEditing) {
        await api.put(`/books/${id}`, payload);
      } else {
        await api.post('/books', payload);
      }

      navigate('/admin/books', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to save book.'));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="container section">
        <div className="center-state">
          <div className="spinner" />
          <p>Loading book...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container section">
      <div className="section-header">
        <div>
          <h1 className="section-title">
            {isEditing ? 'Edit Book' : 'Add New Book'}
          </h1>
          <p className="section-subtitle">
            {isEditing
              ? 'Update catalog information and inventory stock'
              : 'Add a new title to the BookNest store'}
          </p>
        </div>
        <Link to="/admin/books" className="btn btn-outline btn-sm">
          ← Back to Manage Books
        </Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="two-col-layout">
        <form className="card" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="book-title">
              Book Title
            </label>
            <input
              id="book-title"
              type="text"
              className="form-control"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="book-author">
                Author
              </label>
              <input
                id="book-author"
                type="text"
                className="form-control"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="book-category">
                Category
              </label>
              <select
                id="book-category"
                className="form-control"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {BOOK_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="book-price">
                Price (USD)
              </label>
              <input
                id="book-price"
                type="number"
                min="0"
                step="0.01"
                className="form-control"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="book-stock">
                Stock Quantity
              </label>
              <input
                id="book-stock"
                type="number"
                min="0"
                step="1"
                className="form-control"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="book-isbn">
                ISBN (Optional)
              </label>
              <input
                id="book-isbn"
                type="text"
                className="form-control"
                placeholder="e.g. 9780132350884"
                value={isbn}
                onChange={(e) => setIsbn(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="book-cover">
                Cover Image URL
              </label>
              <input
                id="book-cover"
                type="url"
                className="form-control"
                placeholder="https://..."
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="book-desc">
              Description
            </label>
            <textarea
              id="book-desc"
              rows="4"
              className="form-control"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting
              ? 'Saving...'
              : isEditing
              ? 'Save Book Changes'
              : 'Create Book'}
          </button>
        </form>

        <aside className="card">
          <h3 style={{ fontSize: '1.05rem', marginBottom: '0.8rem' }}>Cover Preview</h3>
          <div className="book-cover-wrap" style={{ borderRadius: '8px', maxWidth: '240px', margin: '0 auto' }}>
            <img
              src={coverImage || FALLBACK_COVER}
              alt={title || 'Book preview'}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = FALLBACK_COVER;
              }}
            />
          </div>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '0.85rem', textAlign: 'center' }}>
            If a cover URL cannot load, BookNest automatically displays a fallback cover.
          </p>
        </aside>
      </div>
    </div>
  );
}
