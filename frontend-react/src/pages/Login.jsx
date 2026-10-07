import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import API_BASE from '../api';

const GOOGLE_CLIENT_ID = 'YOUR_NEW_ECOMMERCE_GOOGLE_CLIENT_ID.apps.googleusercontent.com';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const googleBtnRef = useRef(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const res = await fetch('${API_BASE}/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) return setError(data.error);
    login({ id: data.id, username: data.username, role: data.role, email: data.email });
    navigate('/shop');
  }

  async function handleGoogleResponse(response) {
    const res = await fetch('${API_BASE}/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ credential: response.credential })
    });
    const data = await res.json();
    if (!res.ok) return setError('Google sign-in failed');
    login({ id: data.id, username: data.username || 'Google User', role: data.role, email: data.email });
    navigate('/shop');
  }

  useEffect(() => {
    if (!window.google) return;
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleResponse
    });
    window.google.accounts.id.renderButton(googleBtnRef.current, { theme: 'outline', size: 'large' });
  }, []);

  return (
    <div className="form-container">
      <h2>Login</h2>
      {error && <div className="form-error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <input placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} required />
        <input placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
        <button className="btn btn-primary" type="submit" style={{ width: '100%', marginBottom: 12 }}>Login</button>
      </form>
      <div ref={googleBtnRef}></div>
      <p>No account? <Link to="/register">Register</Link></p>
    </div>
  );
}