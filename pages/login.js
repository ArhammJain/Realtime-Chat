// frontend/pages/login.js
import { useState } from 'react';
import Router from 'next/router';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    if (!username.trim()) return alert('Enter username');
    if (!password) return alert('Enter password');

    try {
      setBusy(true);

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // cookie from API route
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const msg = data?.error || 'Login failed';
        alert(msg);
        return;
      }

      // Cookie is set by the API route on the same domain
      Router.push('/chat');
    } catch (err) {
      console.error(err);
      alert(err.message || 'Login failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="page-bg">
        <main className="center-wrap">
          <form onSubmit={handleLogin} className="card" aria-live="polite">
            <div className="card-header">
              <h1 className="card__title">Welcome back</h1>
              <p className="card__subtitle">Please enter your details to sign in.</p>
            </div>

            <div className="card__form">
              <div className="input-group">
                <label className="label" htmlFor="username">Username</label>
                <input
                  id="username"
                  type="text"
                  name="username"
                  placeholder="e.g. arham"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>

              <div className="input-group">
                <label className="label" htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>

              <button type="submit" className="btn-primary" disabled={busy}>
                {busy ? (
                  <span className="loading-dots">Signing in...</span>
                ) : (
                  'Sign In'
                )}
              </button>

              <div className="card__foot">
                <span className="text-muted">Don't have an account? </span>
                <a href="/signup" className="link-highlight">Create account</a>
              </div>
            </div>
          </form>
        </main>
      </div>

      <style jsx global>{`
        :root {
          /* Restored InterJob Palette */
          --primary: #1D56CF; /* Monday Blues */
          --bg-color: #FDF9F2; /* Oat Milk */
          --text-main: #1C1C1C; /* Charcoal Black */
          --text-muted: #666666;
          --card-bg: #FFFFFF;
          --input-bg: #FAFAFA;
          --border: #E5E5E5;
          --focus-ring: rgba(29, 86, 207, 0.2);
          --radius-lg: 24px;
          --radius-md: 12px;
        }

        html, body {
          height: 100%;
          margin: 0;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          background-color: var(--bg-color);
          color: var(--text-main);
          -webkit-font-smoothing: antialiased;
        }

        /* Centering Layout */
        .page-bg {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .center-wrap {
          width: 100%;
          max-width: 400px;
        }

        /* Card Design */
        .card {
          background: var(--card-bg);
          padding: 40px;
          border-radius: var(--radius-lg);
          box-shadow: 
            0 4px 6px -1px rgba(0, 0, 0, 0.02), 
            0 20px 40px -8px rgba(28, 28, 28, 0.08);
          border: 1px solid rgba(0,0,0,0.02);
          animation: floatIn 0.4s ease-out forwards;
        }

        .card-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .card__title {
          font-size: 26px;
          font-weight: 700;
          letter-spacing: -0.02em;
          margin: 0 0 8px 0;
          color: var(--text-main);
        }

        .card__subtitle {
          font-size: 14px;
          color: var(--text-muted);
          margin: 0;
        }

        /* Form Elements */
        .card__form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
          text-align: left;
        }

        .label {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-main);
        }

        input {
          width: 100%;
          padding: 14px 16px;
          font-size: 15px;
          border-radius: var(--radius-md);
          border: 1px solid var(--border);
          background: var(--input-bg);
          color: var(--text-main);
          transition: all 0.2s ease;
          box-sizing: border-box; 
          outline: none;
        }

        input:hover {
          border-color: #d1d1d1;
        }

        input:focus {
          border-color: var(--primary);
          background: #fff;
          box-shadow: 0 0 0 4px var(--focus-ring);
        }

        input::placeholder {
          color: #aaa;
        }

        /* Primary Action Button */
        .btn-primary {
          margin-top: 10px;
          width: 100%;
          padding: 14px;
          border: none;
          background-color: var(--primary);
          color: white;
          font-size: 15px;
          font-weight: 600;
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: transform 0.1s ease, background-color 0.2s;
        }

        .btn-primary:hover:not(:disabled) {
          background-color: #1646ad;
          transform: translateY(-1px);
        }

        .btn-primary:active:not(:disabled) {
          transform: translateY(0);
        }

        .btn-primary:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          background-color: var(--text-muted);
        }

        /* Footer / Link */
        .card__foot {
          text-align: center;
          font-size: 14px;
          margin-top: 12px;
        }

        .text-muted {
          color: var(--text-muted);
        }

        .link-highlight {
          color: var(--primary);
          font-weight: 600;
          text-decoration: none;
          transition: color 0.2s;
        }

        .link-highlight:hover {
          text-decoration: underline;
          color: #1646ad;
        }

        @keyframes floatIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 480px) {
          .card {
            padding: 24px;
            border-radius: 20px;
          }
          .card__title { font-size: 22px; }
        }
      `}</style>
    </>
  );
}