import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api, { getErrorMessage } from '../services/api';
import BookCard from '../components/BookCard';
import { BOOK_CATEGORIES } from '../constants/categories';

export default function BooksPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';
  const initialCategory = searchParams.get('category') || 'All';

  const [search, setSearch] = useState(initialSearch);
  const [category, setCategory] = useState(initialCategory);
  const [sort, setSort] = useState('newest');
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setSearch(searchParams.get('search') || '');
    setCategory(searchParams.get('category') || 'All');
  }, [searchParams]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const params = { sort };
        if (search.trim()) params.search = search.trim();
        if (category && category !== 'All') params.category = category;

        const { data } = await api.get('/books', { params });
        setBooks(data.books);
      } catch (err) {
        setError(getErrorMessage(err, 'Failed to fetch books.'));
      } finally {
        setLoading(false);
      }
    }, 180);

    return () => clearTimeout(timer);
  }, [search, category, sort]);

  function handleCategoryChange(nextCategory) {
    setCategory(nextCategory);
    const nextParams = new URLSearchParams(searchParams);
    if (nextCategory === 'All') {
      nextParams.delete('category');
    } else {
      nextParams.set('category', nextCategory);
    }
    setSearchParams(nextParams);
  }

  function handleSearchChange(value) {
    setSearch(value);
    const nextParams = new URLSearchParams(searchParams);
    if (value.trim()) {
      nextParams.set('search', value);
    } else {
      nextParams.delete('search');
    }
    setSearchParams(nextParams);
  }

  return (
    <div className="container section">
      <div className="section-header">
        <div>
          <h1 className="section-title">All Books</h1>
          <p className="section-subtitle">
            {loading ? 'Searching catalog...' : `Showing ${books.length} books`}
          </p>
        </div>
      </div>

      <div className="filters-bar">
        <div>
          <label className="form-label" htmlFor="books-search">
            Search Title or Author
          </label>
          <input
            id="books-search"
            type="search"
            className="form-control"
            placeholder="e.g. Clean Code, James Clear..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>

        <div>
          <label className="form-label" htmlFor="books-category">
            Category
          </label>
          <select
            id="books-category"
            className="form-control"
            value={category}
            onChange={(e) => handleCategoryChange(e.target.value)}
          >
            <option value="All">All Categories</option>
            {BOOK_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="form-label" htmlFor="books-sort">
            Sort By
          </label>
          <select
            id="books-sort"
            className="form-control"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="newest">Newest First</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="title_asc">Title: A to Z</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="center-state">
          <div className="spinner" />
          <p>Loading catalog...</p>
        </div>
      ) : error ? (
        <div className="alert alert-error">{error}</div>
      ) : books.length === 0 ? (
        <div className="center-state">
          <h3>No matching books found</h3>
          <p style={{ color: 'var(--text-muted)' }}>
            Try adjusting your search keywords or selecting another category.
          </p>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => {
              setSearch('');
              setCategory('All');
              setSearchParams({});
            }}
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="book-grid">
          {books.map((book) => (
            <BookCard key={book._id} book={book} />
          ))}
        </div>
      )}
    </div>
  );
}
