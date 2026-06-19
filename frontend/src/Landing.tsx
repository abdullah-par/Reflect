import { Link, Navigate } from 'react-router-dom';

export default function Landing() {
  const token = localStorage.getItem('antigravity_token');
  if (token) {
    return <Navigate to="/app" replace />;
  }

  return (
    <div className="landing-minimal">
      <h1 className="landing-title">Reflect</h1>
      <p className="landing-subtitle">
        A private notebook that happens to be smart.
      </p>
      <Link to="/auth" className="quiet-link">
        enter
      </Link>
    </div>
  );
}
