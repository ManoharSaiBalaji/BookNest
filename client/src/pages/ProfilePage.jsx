import { useState } from 'react';
import { Link } from 'react-router-dom';
import api, { getErrorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [street, setStreet] = useState(user?.address?.street || '');
  const [city, setCity] = useState(user?.address?.city || '');
  const [state, setState] = useState(user?.address?.state || '');
  const [postalCode, setPostalCode] = useState(user?.address?.postalCode || '');

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage('');
    setError('');
    setSaving(true);

    try {
      const { data } = await api.put('/auth/me', {
        name: name.trim(),
        phone: phone.trim(),
        address: {
          street: street.trim(),
          city: city.trim(),
          state: state.trim(),
          postalCode: postalCode.trim(),
        },
      });
      updateUser(data.user);
      setMessage('Profile updated successfully.');
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to update profile.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="container section">
      <div className="section-header">
        <div>
          <h1 className="section-title">My Profile</h1>
          <p className="section-subtitle">Manage your account and default shipping address</p>
        </div>
        <Link to="/orders" className="btn btn-outline btn-sm">
          View My Orders
        </Link>
      </div>

      <div className="card" style={{ maxWidth: '680px' }}>
        <div style={{ marginBottom: '1.2rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Account Email</div>
          <div style={{ fontWeight: 600 }}>{user?.email}</div>
          <span
            className="stock-tag"
            style={{
              background: '#EBF5FF',
              color: 'var(--primary)',
              marginTop: '0.4rem',
              display: 'inline-block',
              textTransform: 'capitalize',
            }}
          >
            Role: {user?.role}
          </span>
        </div>

        {message && <div className="alert alert-success">{message}</div>}
        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="prof-name">
                Full Name
              </label>
              <input
                id="prof-name"
                type="text"
                className="form-control"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="prof-phone">
                Phone Number
              </label>
              <input
                id="prof-phone"
                type="text"
                className="form-control"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="prof-street">
              Default Street Address
            </label>
            <input
              id="prof-street"
              type="text"
              className="form-control"
              value={street}
              onChange={(e) => setStreet(e.target.value)}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="prof-city">
                City
              </label>
              <input
                id="prof-city"
                type="text"
                className="form-control"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="prof-state">
                State
              </label>
              <input
                id="prof-state"
                type="text"
                className="form-control"
                value={state}
                onChange={(e) => setState(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="prof-zip">
              Postal Code
            </label>
            <input
              id="prof-zip"
              type="text"
              className="form-control"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}
