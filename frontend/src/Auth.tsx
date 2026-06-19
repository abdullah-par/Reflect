import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { API_URL } from './api';
import { Theme } from './useTheme';

interface Props {
  theme: Theme;
  toggleTheme: () => void;
}

function MoonIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

export default function Auth({ theme, toggleTheme }: Props) {
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
      <div className="auth-card">
        <div className="auth-card-top">
          <Link to="/" className="auth-wordmark">
            Reflect
          </Link>
          <button
            type="button"
            onClick={toggleTheme}
            className="theme-toggle-btn"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>
        <p className="auth-tagline">
          {isLogin ? 'Welcome back.' : 'Start your journey.'}
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-input-group">
            <label className="auth-input-label" htmlFor="auth-email">Email</label>
            <input
              id="auth-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="auth-input-group">
            <label className="auth-input-label" htmlFor="auth-password">Password</label>
            <input
              id="auth-password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete={isLogin ? 'current-password' : 'new-password'}
            />
          </div>
          <button type="submit" className="auth-submit">
            {isLogin ? 'Sign in' : 'Create account'}
          </button>
        </form>

        {error && <p className="quiet-error">{error}</p>}
        {message && <p className="quiet-success">{message}</p>}

        <div className="auth-switch">
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
              setMessage(null);
            }}
            className="auth-switch-btn"
          >
            {isLogin ? 'No account yet? Create one →' : 'Already have one? Sign in →'}
          </button>
        </div>
      </div>
    </div>
  );
}
