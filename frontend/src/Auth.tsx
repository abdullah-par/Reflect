import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { API_URL } from './api';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  const parseError = async (res: Response, fallback: string) => {
    try {
      const data = await res.json();
      if (typeof data.detail === 'string') return data.detail;
      if (Array.isArray(data.detail)) return data.detail.map((d: { msg?: string }) => d.msg).filter(Boolean).join('. ');
    } catch {
      /* ignore */
    }
    return fallback;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    try {
      if (isLogin) {
        const formData = new FormData();
        formData.append('username', email);
        formData.append('password', password);

        const res = await fetch(`${API_URL}/token`, {
          method: 'POST',
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          localStorage.setItem('antigravity_token', data.access_token);
          navigate('/app');
        } else {
          setError(await parseError(res, 'Could not sign in. Check your details and try again.'));
        }
      } else {
        const res = await fetch(`${API_URL}/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        if (res.ok) {
          setIsLogin(true);
          setMessage('Account created. You can sign in now.');
        } else {
          setError(await parseError(res, 'Could not create account. Try a different email.'));
        }
      }
    } catch {
      setError('Cannot reach the server. Make sure the backend is running on localhost:8000.');
    }
  };

  return (
    <div className="auth-page">
      <Link to="/" className="auth-wordmark">
        Reflect
      </Link>

      <form onSubmit={handleSubmit} className="auth-form">
        <input
          type="email"
          placeholder="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
        <input
          type="password"
          placeholder="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete={isLogin ? 'current-password' : 'new-password'}
        />
        <button type="submit" className="auth-submit">
          {isLogin ? 'enter' : 'create account'}
        </button>
      </form>

      {error && <p className="quiet-error">{error}</p>}
      {message && <p className="quiet-success">{message}</p>}

      <button
        type="button"
        onClick={() => {
          setIsLogin(!isLogin);
          setError(null);
          setMessage(null);
        }}
        className="quiet-link muted"
      >
        {isLogin ? 'need an account?' : 'already have one?'}
      </button>
    </div>
  );
}
