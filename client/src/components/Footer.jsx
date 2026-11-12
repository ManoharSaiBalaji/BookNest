import { Link } from 'react-router-dom';
import { BOOK_CATEGORIES } from '../constants/categories';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <h4 className="font-serif" style={{ fontSize: '1.25rem' }}>
            BookNest
          </h4>
          <p style={{ margin: 0, fontSize: '0.88rem', maxWidth: '340px', opacity: 0.85 }}>
            Your curated neighborhood online bookstore for fiction, technology,
            business, education, mystery, and personal growth.
          </p>
        </div>

        <div>
          <h4>Explore Categories</h4>
          <div className="footer-links">
            {BOOK_CATEGORIES.map((category) => (
              <Link
                key={category}
                to={`/books?category=${encodeURIComponent(category)}`}
              >
                {category}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <h4>Quick Links</h4>
          <div className="footer-links">
            <Link to="/books">Browse All Books</Link>
            <Link to="/cart">Shopping Cart</Link>
            <Link to="/orders">My Orders</Link>
            <Link to="/login">Customer &amp; Admin Login</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
