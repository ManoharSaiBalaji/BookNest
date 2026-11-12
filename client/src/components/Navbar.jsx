import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { BOOK_CATEGORIES } from '../constants/categories';

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [catOpen, setCatOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  function handleSearchSubmit(e) {
    e.preventDefault();
    const trimmed = searchTerm.trim();
    setMobileOpen(false);
    if (trimmed) {
      navigate(`/books?search=${encodeURIComponent(trimmed)}`);
    } else {
      navigate('/books');
    }
  }

  function handleLogout() {
    logout();
    setUserMenuOpen(false);
    setMobileOpen(false);
    navigate('/');
  }

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="brand-logo" onClick={() => setMobileOpen(false)}>
          <span className="brand-mark">BN</span>
          <span>BookNest</span>
        </Link>

        <form className="nav-search" onSubmit={handleSearchSubmit}>
          <input
            type="search"
            placeholder="Search books by title or author..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Search books"
          />
          <button type="submit">Search</button>
        </form>

        <nav className="nav-links" aria-label="Primary navigation">
          <NavLink to="/books" className="nav-link">
            All Books
          </NavLink>

          <div
            className="nav-dropdown"
            onMouseLeave={() => setCatOpen(false)}
          >
            <button
              type="button"
              className="nav-link nav-dropdown-btn"
              onClick={() => setCatOpen((prev) => !prev)}
            >
              Categories ▾
            </button>
            {catOpen && (
              <div className="nav-dropdown-menu">
                <Link
                  to="/books"
                  className="nav-dropdown-item"
                  onClick={() => setCatOpen(false)}
                >
                  All Categories
                </Link>
                {BOOK_CATEGORIES.map((category) => (
                  <Link
                    key={category}
                    to={`/books?category=${encodeURIComponent(category)}`}
                    className="nav-dropdown-item"
                    onClick={() => setCatOpen(false)}
                  >
                    {category}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <Link to="/cart" className="cart-link" aria-label="Shopping cart">
            <span>Cart</span>
            <span className="cart-badge">{itemCount}</span>
          </Link>

          {isAuthenticated ? (
            <div
              className="nav-dropdown"
              onMouseLeave={() => setUserMenuOpen(false)}
            >
              <button
                type="button"
                className="nav-link nav-dropdown-btn"
                onClick={() => setUserMenuOpen((prev) => !prev)}
              >
                {user.name.split(' ')[0]} ▾
              </button>
              {userMenuOpen && (
                <div className="nav-dropdown-menu align-right">
                  {isAdmin && (
                    <Link
                      to="/admin"
                      className="nav-dropdown-item"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      Admin Dashboard
                    </Link>
                  )}
                  <Link
                    to="/orders"
                    className="nav-dropdown-item"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    My Orders
                  </Link>
                  <Link
                    to="/profile"
                    className="nav-dropdown-item"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    Profile
                  </Link>
                  <button
                    type="button"
                    className="nav-dropdown-item"
                    style={{ color: '#DC2626', fontWeight: 600 }}
                    onClick={handleLogout}
                  >
                    Log Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login" className="nav-link">
                Login
              </Link>
              <Link to="/register" className="btn btn-accent btn-sm">
                Register
              </Link>
            </>
          )}
        </nav>

        <button
          type="button"
          className="mobile-menu-btn"
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-label="Toggle navigation menu"
        >
          {mobileOpen ? 'Close' : `Menu (${itemCount})`}
        </button>
      </div>

      <div className={`mobile-drawer ${mobileOpen ? 'open' : ''}`}>
        <form className="nav-search" style={{ display: 'flex', maxWidth: '100%' }} onSubmit={handleSearchSubmit}>
          <input
            type="search"
            placeholder="Search books by title or author..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button type="submit">Go</button>
        </form>

        <Link to="/books" className="nav-link" onClick={() => setMobileOpen(false)}>
          All Books
        </Link>
        <Link to="/cart" className="nav-link" onClick={() => setMobileOpen(false)}>
          Shopping Cart ({itemCount})
        </Link>

        {isAuthenticated ? (
          <>
            {isAdmin && (
              <Link to="/admin" className="nav-link" onClick={() => setMobileOpen(false)}>
                Admin Dashboard
              </Link>
            )}
            <Link to="/orders" className="nav-link" onClick={() => setMobileOpen(false)}>
              My Orders
            </Link>
            <Link to="/profile" className="nav-link" onClick={() => setMobileOpen(false)}>
              Profile
            </Link>
            <button
              type="button"
              className="btn btn-danger btn-sm"
              onClick={handleLogout}
            >
              Log Out
            </button>
          </>
        ) : (
          <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.25rem' }}>
            <Link
              to="/login"
              className="btn btn-outline btn-sm"
              style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.4)' }}
              onClick={() => setMobileOpen(false)}
            >
              Login
            </Link>
            <Link
              to="/register"
              className="btn btn-accent btn-sm"
              onClick={() => setMobileOpen(false)}
            >
              Register
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
