import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { I } from './design';

const COLOR_SWATCHES = ['#4ecdc4', '#e85d75', '#e8a838', '#7c5cbf', '#5c8cbf', '#5ce878'];

// ========== Form field (label + input with optional right-slot) ==========

function FormField({
  label,
  placeholder,
  value,
  onChange,
  type = 'text',
  required,
  minLength,
  maxLength,
  autoComplete,
  rightSlot,
}) {
  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 11,
          color: 'var(--text-muted)',
          fontWeight: 600,
          marginBottom: 6,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
        }}
      >
        <span>{label}</span>
        {rightSlot}
      </div>
      <input
        className="sq-input"
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        minLength={minLength}
        maxLength={maxLength}
        autoComplete={autoComplete}
      />
    </div>
  );
}

// ========== Main AuthForm — renders the full glass card ==========

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
    <form
      onSubmit={handleSubmit}
      className="fade-up"
      style={{
        width: 440,
        maxWidth: 'calc(100vw - 40px)',
        borderRadius: 'var(--r-xl)',
        background: 'rgba(12,12,24,0.62)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 30px 80px rgba(0,0,0,0.5), 0 0 80px rgba(232,168,56,0.08)',
        padding: '40px 36px 32px',
        position: 'relative',
      }}
    >
      {/* Ambient gold edge */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: -1,
          borderRadius: 'calc(var(--r-xl) + 1px)',
          background: 'linear-gradient(180deg, rgba(232,168,56,0.25), transparent 40%)',
          padding: 1,
          WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
          pointerEvents: 'none',
        }}
      />

      {/* Brand mark + title */}
      <div style={{ textAlign: 'center', marginBottom: 28, position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background:
                'radial-gradient(circle at 30% 30%, rgba(232,168,56,0.35), rgba(232,168,56,0.05))',
              border: '1px solid rgba(232,168,56,0.3)',
              boxShadow: '0 0 32px rgba(232,168,56,0.3)',
              overflow: 'hidden',
            }}
          >
            <img src="/logo.png" alt="" style={{ width: 36, height: 36 }} />
          </div>
        </div>
        <div className="title-xl" style={{ fontSize: 30 }}>
          Pull up a chair.
        </div>
        <div
          style={{
            color: 'var(--text-secondary)',
            marginTop: 8,
            fontSize: 14,
            lineHeight: 1.5,
          }}
        >
          A cozy room for you and your friends. Voice chat with a view.
        </div>
      </div>

      {/* Tab toggle with sliding indicator */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 10,
          padding: 4,
          marginBottom: 20,
          position: 'relative',
        }}
      >
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: 4,
            bottom: 4,
            width: 'calc(50% - 4px)',
            left: tab === 'signin' ? 4 : 'calc(50%)',
            borderRadius: 8,
            background: 'linear-gradient(180deg, rgba(232,168,56,0.18), rgba(200,138,32,0.12))',
            border: '1px solid rgba(232,168,56,0.35)',
            transition: 'left 220ms ease',
          }}
        />
        {['signin', 'signup'].map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setTab(m)}
            style={{
              position: 'relative',
              zIndex: 1,
              padding: '9px 0',
              fontSize: 13,
              fontWeight: 600,
              color: tab === m ? '#f2d78a' : 'var(--text-secondary)',
              letterSpacing: '0.01em',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            {m === 'signin' ? 'Sign In' : 'Sign Up'}
          </button>
        ))}
      </div>

      {/* Form fields */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {tab === 'signup' && (
          <>
            <FormField
              label="Display name"
              placeholder="rhea"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              maxLength={20}
            />
            <div>
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--text-muted)',
                  fontWeight: 600,
                  marginBottom: 6,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}
              >
                Your colour
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {COLOR_SWATCHES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    title={c}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: c,
                      border:
                        color === c
                          ? '2px solid #f2d78a'
                          : '2px solid rgba(255,255,255,0.08)',
                      boxShadow:
                        color === c ? `0 0 12px ${c}88` : 'none',
                      cursor: 'pointer',
                      transition: 'all 160ms ease',
                      padding: 0,
                    }}
                  />
                ))}
              </div>
            </div>
          </>
        )}

        <FormField
          label="Email"
          type="email"
          placeholder="you@sidequest.gg"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />

        <FormField
          label="Password"
          type="password"
          placeholder="••••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          autoComplete={tab === 'signin' ? 'current-password' : 'new-password'}
          rightSlot={
            tab === 'signin' ? (
              <span style={{ fontSize: 11, color: 'var(--text-muted)', cursor: 'default' }}>
                Forgot?
              </span>
            ) : null
          }
        />

        {error && (
          <div
            style={{
              padding: '9px 12px',
              background: 'rgba(232,93,117,0.08)',
              border: '1px solid rgba(232,93,117,0.25)',
              borderRadius: 'var(--r-sm)',
              color: '#f2a4b0',
              fontSize: 12,
              fontWeight: 500,
            }}
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          className="gold-btn"
          disabled={submitting}
          style={{
            marginTop: 10,
            padding: '13px 16px',
            fontSize: 14,
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
          }}
        >
          {submitting
            ? 'Please wait…'
            : tab === 'signin'
            ? 'Enter the lounge'
            : 'Create account'}
          {!submitting && <I.arrow s={14} />}
        </button>

        {/* Divider */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            color: 'var(--text-muted)',
            fontSize: 11,
            margin: '6px 0',
            letterSpacing: '0.02em',
          }}
        >
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
          <span>or continue with</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
        </div>

        {/* Social row — visual only for now */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          {['Google', 'Discord', 'Apple'].map((p) => (
            <button
              key={p}
              type="button"
              className="ghost-btn"
              disabled
              title="Coming soon"
              style={{
                padding: '10px 0',
                fontSize: 12,
                opacity: 0.55,
                cursor: 'not-allowed',
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
    </form>
  );
}
