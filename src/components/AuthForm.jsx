import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import Icon from './Icon';

const COLOR_SWATCHES = [
  '#4ecdc4', '#e85d75', '#e8a838',
  '#7c5cbf', '#5c8cbf', '#5ce878',
];

export default function AuthForm() {
  const [tab, setTab] = useState('signin'); // 'signin' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [color, setColor] = useState(COLOR_SWATCHES[0]);
  const [submitting, setSubmitting] = useState(false);

  const signIn = useAuthStore((s) => s.signIn);
  const signUp = useAuthStore((s) => s.signUp);
  const error = useAuthStore((s) => s.error);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    if (tab === 'signin') {
      await signIn({ email, password });
    } else {
      await signUp({ email, password, displayName, color });
    }
    setSubmitting(false);
  };

  return (
    <div className="auth-form">
      <div className="auth-tabs">
        <button
          className={`auth-tab ${tab === 'signin' ? 'active' : ''}`}
          onClick={() => setTab('signin')}
        >
          Sign In
        </button>
        <button
          className={`auth-tab ${tab === 'signup' ? 'active' : ''}`}
          onClick={() => setTab('signup')}
        >
          Sign Up
        </button>
      </div>

      <form onSubmit={handleSubmit} className="auth-fields">
        <label className="auth-label">
          Email
          <input
            type="email"
            className="auth-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </label>

        <label className="auth-label">
          Password
          <input
            type="password"
            className="auth-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete={tab === 'signin' ? 'current-password' : 'new-password'}
          />
        </label>

        {tab === 'signup' && (
          <>
            <label className="auth-label">
              Display Name
              <input
                type="text"
                className="auth-input"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                maxLength={20}
                placeholder="1–20 characters"
              />
            </label>

            <div className="auth-label">
              Your Color
              <div className="color-swatches">
                {COLOR_SWATCHES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`color-swatch ${color === c ? 'active' : ''}`}
                    style={{ background: c }}
                    onClick={() => setColor(c)}
                    title={c}
                  />
                ))}
              </div>
            </div>
          </>
        )}

        {error && <div className="auth-error">{error}</div>}

        <button
          type="submit"
          className="auth-submit"
          disabled={submitting}
        >
          {submitting
            ? 'Please wait...'
            : tab === 'signin'
              ? 'Sign In'
              : 'Create Account'}
        </button>
      </form>
    </div>
  );
}
