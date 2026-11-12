import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { getErrorMessage } from '../services/api';
import BookCard from '../components/BookCard';
import { BOOK_CATEGORIES } from '../constants/categories';

const CATEGORY_TAGLINES = {
  Fiction: 'Stories & novels',
  Technology: 'Code & systems',
  Education: 'Study & mastery',
  Business: 'Strategy & finance',
  'Self-Help': 'Habits & focus',
  Mystery: 'Thrillers & clues',
};

export default function HomePage() {
  const [featuredBooks, setFeaturedBooks] = useState([]);
  const [totalBooks, setTotalBooks] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchFeatured() {
      try {
        const { data } = await api.get('/books', { params: { limit: 8, sort: 'newest' } });
        setFeaturedBooks(data.books);
        setTotalBooks(data.total);
      } catch (err) {
        setError(getErrorMessage(err, 'Unable to load featured books.'));
      } finally {
        setLoading(false);
      }
    }
    fetchFeatured();
  }, []);

  return (
    <div>
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <span className="hero-eyebrow">Curated Online Bookstore</span>
            <h1>Discover Your Next Great Read at BookNest</h1>
            <p>
              Browse handpicked titles across fiction, technology, education,
              business, self-help, and mystery. Order in seconds with simple
              Cash on Delivery checkout.
            </p>
            <div className="hero-actions">
              <Link to="/books" className="btn btn-accent">
                Browse All Books
              </Link>
              <Link
                to="/register"
                className="btn btn-outline"
                style={{ color: '#FFFFFF', borderColor: 'rgba(255,255,255,0.4)' }}
              >
                Create Customer Account
              </Link>
            </div>
          </div>

          <div className="hero-highlight-card">
            <h3 style={{ color: '#FFFFFF', marginBottom: '0.35rem' }}>
              Why Readers Love BookNest
            </h3>
            <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.85 }}>
              Real-time stock availability, clean category browsing, and fast
              order tracking from checkout to doorstep.
            </p>
            <div className="hero-stats">
              <div className="hero-stat">
                <strong>{totalBooks || '12+'}</strong>
                <span>Curated Titles</span>
              </div>
              <div className="hero-stat">
                <strong>6</strong>
                <span>Book Categories</span>
              </div>
              <div className="hero-stat">
                <strong>COD</strong>
                <span>Cash on Delivery</span>
              </div>
              <div className="hero-stat">
                <strong>Live</strong>
                <span>Order Status Updates</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-header">
            <div>
              <h2 className="section-title">Shop by Category</h2>
              <p className="section-subtitle">
                Jump straight into the subjects you enjoy most
              </p>
            </div>
            <Link to="/books" className="btn btn-outline btn-sm">
              View Catalog
            </Link>
          </div>

          <div className="category-grid">
            {BOOK_CATEGORIES.map((category) => (
              <Link
                key={category}
                to={`/books?category=${encodeURIComponent(category)}`}
                className="category-card"
              >
                <div className="category-card-title">{category}</div>
                <div className="category-card-sub">
                  {CATEGORY_TAGLINES[category]}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-header">
            <div>
              <h2 className="section-title">Featured Books</h2>
              <p className="section-subtitle">
                Fresh arrivals and reader favorites ready to ship
              </p>
            </div>
            <Link to="/books" className="btn btn-primary btn-sm">
              Explore All Books →
            </Link>
          </div>

          {loading ? (
            <div className="center-state">
              <div className="spinner" />
              <p>Loading books...</p>
            </div>
          ) : error ? (
            <div className="alert alert-error">{error}</div>
          ) : featuredBooks.length === 0 ? (
            <div className="center-state">
              <h3>No books available yet</h3>
              <p style={{ color: 'var(--text-muted)' }}>
                Seed sample books or add books from the Admin Dashboard.
              </p>
            </div>
          ) : (
            <div className="book-grid">
              {featuredBooks.map((book) => (
                <BookCard key={book._id} book={book} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
