import { useState, Fragment } from 'react';
import { useRoomStore } from '../stores/roomStore';
import { useAuthStore } from '../stores/authStore';
import { Aurora, I } from './design';

// ========== Theme metadata (local to the wizard — mirrors lobby's THEME_META) ==========

const THEMES = {
  'gaming-den': {
    id: 'gaming-den',
    name: 'Gaming Den',
    blurb: 'LED glow, neon strips, late-night couch coop.',
    accent: '#7c5cbf',
    accent2: '#e85d75',
    wall: '#1a1026',
    floor: '#2a2040',
    floorAlt: '#1f1632',
  },
  'scifi-lounge': {
    id: 'scifi-lounge',
    name: 'Sci-Fi Lounge',
    blurb: 'Floating spaceship deck, starfield beyond the viewport.',
    accent: '#4ecdc4',
    accent2: '#5c8cbf',
    wall: '#0c1a24',
    floor: '#102a3a',
    floorAlt: '#0a1e2a',
  },
  'fantasy-tavern': {
    id: 'fantasy-tavern',
    name: 'Fantasy Tavern',
    blurb: 'Warm wood, hearth glow, and a bar counter for stories.',
    accent: '#e8a838',
    accent2: '#c88a20',
    wall: '#2a1d10',
    floor: '#3a2a18',
    floorAlt: '#2a1d10',
  },
  'retro-arcade': {
    id: 'retro-arcade',
    name: 'Retro Arcade',
    blurb: 'Neon grid, synthwave pulse, CRT scanline dreams.',
    accent: '#e85d75',
    accent2: '#e8a838',
    wall: '#1a0a1a',
    floor: '#2a102a',
    floorAlt: '#1a081a',
  },
};

function shade(hex, amt) {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, Math.min(255, ((n >> 16) & 0xff) + amt));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 0xff) + amt));
  const b = Math.max(0, Math.min(255, (n & 0xff) + amt));
  return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}

// ========== Stepper (3 pips with check on complete) ==========

function Stepper({ step, labels }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      {labels.map((l, i) => (
        <Fragment key={i}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                fontWeight: 700,
                background: i <= step ? 'rgba(232,168,56,0.18)' : 'rgba(255,255,255,0.04)',
                border:
                  i <= step
                    ? '1px solid rgba(232,168,56,0.45)'
                    : '1px solid rgba(255,255,255,0.08)',
                color: i <= step ? '#f2d78a' : 'var(--text-muted)',
                boxShadow: i === step ? '0 0 16px rgba(232,168,56,0.35)' : 'none',
              }}
            >
              {i < step ? <I.check s={12} /> : i + 1}
            </div>
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: i <= step ? 'var(--text-primary)' : 'var(--text-muted)',
              }}
            >
              {l}
            </span>
          </div>
          {i < labels.length - 1 && (
            <div
              style={{
                width: 32,
                height: 1,
                background: i < step ? 'rgba(232,168,56,0.4)' : 'rgba(255,255,255,0.08)',
              }}
            />
          )}
        </Fragment>
      ))}
    </div>
  );
}

// ========== Step 0: pick a theme ==========

function StepTheme({ theme, setTheme }) {
  return (
    <>
      <div className="eyebrow" style={{ marginBottom: 12 }}>
        Step 01 — Pick a setting
      </div>
      <div
        className="title-xl"
        style={{ fontSize: 40, textAlign: 'center', marginBottom: 10 }}
      >
        Every great night needs a room.
      </div>
      <div
        style={{
          color: 'var(--text-secondary)',
          fontSize: 15,
          textAlign: 'center',
          marginBottom: 40,
          maxWidth: 480,
        }}
      >
        Choose the vibe. You can redecorate anytime, and guests don't need an account to drop in.
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18, width: '100%' }}>
        {Object.values(THEMES).map((t) => {
          const active = theme === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTheme(t.id)}
              style={{
                padding: 0,
                textAlign: 'left',
                borderRadius: 'var(--r-lg)',
                background: active
                  ? 'linear-gradient(180deg, rgba(232,168,56,0.12), rgba(12,12,24,0.7))'
                  : 'rgba(12,12,24,0.5)',
                border: active
                  ? '1px solid rgba(232,168,56,0.5)'
                  : '1px solid rgba(255,255,255,0.07)',
                overflow: 'hidden',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                transition: 'all 180ms ease',
                boxShadow: active ? '0 0 32px rgba(232,168,56,0.18)' : 'none',
                cursor: 'pointer',
              }}
            >
              <div
                style={{
                  height: 160,
                  position: 'relative',
                  overflow: 'hidden',
                  background: `linear-gradient(145deg, ${shade(t.wall, 8)}, ${shade(t.floor, -4)})`,
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: '62%',
                    transform: 'translate(-50%,-50%)',
                    width: 140,
                    height: 70,
                    background: `linear-gradient(${t.floor}, ${t.floorAlt})`,
                    clipPath: 'polygon(50% 0, 100% 50%, 50% 100%, 0 50%)',
                    filter: `drop-shadow(0 0 20px ${t.accent}44)`,
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    left: '46%',
                    top: '38%',
                    width: 28,
                    height: 42,
                    background: `linear-gradient(180deg, ${t.accent}, ${shade(t.accent, -20)})`,
                    boxShadow: `0 0 24px ${t.accent}55`,
                    borderRadius: 2,
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    left: '56%',
                    top: '44%',
                    width: 22,
                    height: 30,
                    background: `linear-gradient(180deg, ${t.accent2}, ${shade(t.accent2, -20)})`,
                    borderRadius: 2,
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: `radial-gradient(60% 60% at 50% 60%, ${t.accent}33, transparent 70%)`,
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background:
                      'repeating-linear-gradient(0deg, rgba(255,255,255,0.02) 0 1px, transparent 1px 3px)',
                  }}
                />
                {active && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 10,
                      right: 10,
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      background: 'rgba(232,168,56,0.9)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#1a1000',
                      boxShadow: '0 0 16px rgba(232,168,56,0.5)',
                    }}
                  >
                    <I.check s={12} />
                  </div>
                )}
              </div>
              <div style={{ padding: 16 }}>
                <div className="title-md" style={{ fontSize: 15, marginBottom: 4 }}>
                  {t.name}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{t.blurb}</div>
              </div>
            </button>
          );
        })}
      </div>
    </>
  );
}

// ========== Step 1: name the room ==========

const NAME_SUGGESTIONS = ['The Hideout', 'Quiet Hours', 'Study Hall', 'After Party'];

function StepName({ theme, name, setName }) {
  const t = THEMES[theme];
  return (
    <>
      <div className="eyebrow" style={{ marginBottom: 12 }}>
        Step 02 — Name it
      </div>
      <div className="title-xl" style={{ fontSize: 40, textAlign: 'center', marginBottom: 36 }}>
        What should we call this place?
      </div>
      <div
        style={{
          display: 'flex',
          gap: 40,
          alignItems: 'center',
          background: 'rgba(12,12,24,0.55)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 'var(--r-xl)',
          padding: 36,
          width: '100%',
        }}
      >
        <div
          style={{
            width: 220,
            height: 180,
            position: 'relative',
            flexShrink: 0,
            background: `linear-gradient(145deg, ${shade(t.wall, 8)}, ${shade(t.floor, -4)})`,
            borderRadius: 'var(--r-lg)',
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: '60%',
              transform: 'translate(-50%,-50%)',
              width: 170,
              height: 85,
              background: `linear-gradient(${t.floor}, ${t.floorAlt})`,
              clipPath: 'polygon(50% 0, 100% 50%, 50% 100%, 0 50%)',
              filter: `drop-shadow(0 0 24px ${t.accent}55)`,
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: '46%',
              top: '36%',
              width: 30,
              height: 50,
              background: `linear-gradient(180deg, ${t.accent}, ${shade(t.accent, -20)})`,
              boxShadow: `0 0 24px ${t.accent}55`,
            }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: 11,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              marginBottom: 10,
              fontWeight: 600,
            }}
          >
            Room name
          </div>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="sq-input"
            maxLength={40}
            style={{
              fontSize: 22,
              padding: '14px 16px',
              fontFamily: 'var(--font-display)',
              fontWeight: 600,
              letterSpacing: '-0.01em',
            }}
          />
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 10 }}>
            Visible to anyone with the join code. You can change this any time in room settings.
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 20, flexWrap: 'wrap' }}>
            {NAME_SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setName(s)}
                className="ghost-btn"
                style={{ padding: '6px 12px', fontSize: 12, borderRadius: 999 }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

// ========== Step 2: the invite ==========

function StepInvite({ theme, name, code, creating, error }) {
  const t = THEMES[theme];
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const link = code
    ? `${window.location.origin}/?join=${encodeURIComponent(code)}`
    : 'sidequest.gg/r/…';

  const copyCode = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {}
  };
  const copyLink = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(link);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 1400);
    } catch {}
  };

  return (
    <>
      <div className="eyebrow" style={{ marginBottom: 12 }}>
        Step 03 — Invite
      </div>
      <div className="title-xl" style={{ fontSize: 40, textAlign: 'center', marginBottom: 12 }}>
        {creating ? 'Opening the door…' : error ? 'Something went sideways' : 'Your door is open.'}
      </div>
      <div
        style={{
          color: 'var(--text-secondary)',
          fontSize: 15,
          textAlign: 'center',
          marginBottom: 30,
          maxWidth: 520,
        }}
      >
        {error
          ? error
          : creating
          ? 'Setting up the room and dialling in the theme — one second.'
          : 'Share the code or link. No account required to join.'}
      </div>

      <div
        style={{
          width: '100%',
          background: 'rgba(12,12,24,0.55)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 'var(--r-xl)',
          padding: 32,
          display: 'grid',
          gridTemplateColumns: '320px 1fr',
          gap: 36,
        }}
      >
        {/* big code tile */}
        <div
          style={{
            borderRadius: 'var(--r-lg)',
            background: 'linear-gradient(180deg, rgba(232,168,56,0.1), rgba(12,12,24,0.4))',
            border: '1px solid rgba(232,168,56,0.28)',
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            boxShadow: '0 0 40px rgba(232,168,56,0.15) inset',
          }}
        >
          <div className="eyebrow" style={{ color: '#c88a20', marginBottom: 14 }}>
            Join code
          </div>
          <div
            className="mono"
            style={{
              fontSize: 42,
              fontWeight: 700,
              letterSpacing: '0.12em',
              color: '#f2d78a',
              textShadow: '0 0 24px rgba(232,168,56,0.5)',
              minHeight: 48,
            }}
          >
            {code || '· · ·'}
          </div>
          <button
            type="button"
            onClick={copyCode}
            disabled={!code}
            className="ghost-btn"
            style={{
              marginTop: 18,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              fontSize: 12,
              opacity: code ? 1 : 0.5,
              cursor: code ? 'pointer' : 'not-allowed',
            }}
          >
            {copied ? <I.check s={12} /> : <I.copy s={12} />}
            {copied ? 'Copied' : 'Copy code'}
          </button>
        </div>

        <div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14 }}>
            Shareable link
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 10,
              padding: '10px 14px',
              marginBottom: 22,
            }}
          >
            <span style={{ color: 'var(--text-muted)', display: 'flex' }}>
              <I.link s={14} />
            </span>
            <span
              className="mono"
              style={{
                fontSize: 13,
                color: 'var(--text-primary)',
                flex: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {link}
            </span>
            <button
              type="button"
              onClick={copyLink}
              disabled={!code}
              className="ghost-btn"
              style={{
                padding: '6px 10px',
                fontSize: 11,
                opacity: code ? 1 : 0.5,
                cursor: code ? 'pointer' : 'not-allowed',
              }}
            >
              {linkCopied ? 'Copied' : 'Copy'}
            </button>
          </div>

          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 10 }}>
            Next up
          </div>
          <ul
            style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              color: 'var(--text-secondary)',
              fontSize: 13,
            }}
          >
            <li style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <span className="dot online" /> Drag furniture from the palette on the left.
            </li>
            <li style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <span className="dot online" /> Click a seat to sit. Your voice follows.
            </li>
            <li style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <span className="dot online" /> Invite a friend — they can knock even without an account.
            </li>
          </ul>
        </div>
      </div>

      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 20, textAlign: 'center' }}>
        {name} &nbsp;·&nbsp; {t.name}
      </div>
    </>
  );
}

// ========== Main wizard ==========

export default function Onboarding() {
  const setOnboardingActive = useRoomStore((s) => s.setOnboardingActive);
  const createRoom = useRoomStore((s) => s.createRoom);
  const setTheme = useRoomStore((s) => s.setTheme);
  const joinCode = useRoomStore((s) => s.joinCode);
  const roomId = useRoomStore((s) => s.roomId);
  const prefillName = useRoomStore((s) => s.onboardingPrefillName);
  const user = useAuthStore((s) => s.user);

  const [step, setStep] = useState(0);
  const [theme, setThemeLocal] = useState('gaming-den');
  const [name, setName] = useState(prefillName || '');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const close = () => setOnboardingActive(false);

  const finish = () => close();

  const skip = () => close();

  const next = async () => {
    setError('');
    if (step === 0) {
      setStep(1);
      return;
    }
    if (step === 1) {
      // Create the room now so step 2 can show the real code
      const trimmed = name.trim();
      if (!trimmed) {
        setError('Give the room a name first.');
        return;
      }
      if (roomId) {
        // Room already exists (user stepped back and forward) — just advance
        setStep(2);
        return;
      }
      setCreating(true);
      setStep(2); // show the step 2 skeleton with "opening the door..." while we wait
      try {
        await createRoom(trimmed, user);
        // Apply theme after creation (default is gaming-den, only update if different)
        if (theme !== 'gaming-den') {
          await setTheme(theme);
        }
      } catch (e) {
        setError(e.message || 'Could not create the room.');
        setStep(1); // back to name step so they can retry
      }
      setCreating(false);
      return;
    }
    if (step === 2) {
      finish();
    }
  };

  const back = () => {
    setError('');
    if (step > 0 && !roomId) setStep(step - 1);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        overflow: 'hidden',
        background: 'rgba(6,6,16,0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        zIndex: 300,
      }}
    >
      <Aurora level="visible" />

      {/* header bar */}
      <div
        style={{
          position: 'absolute',
          top: 24,
          left: 32,
          right: 32,
          zIndex: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background:
                'radial-gradient(circle at 30% 30%, rgba(232,168,56,0.4), rgba(232,168,56,0.08))',
              border: '1px solid rgba(232,168,56,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            <img src="/logo.png" alt="" style={{ width: 18, height: 18 }} />
          </div>
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: 15,
              letterSpacing: '0.02em',
            }}
          >
            Sidequest
          </span>
        </div>
        <Stepper step={step} labels={['Theme', 'Name', 'Invite']} />
        <button
          type="button"
          className="ghost-btn"
          onClick={skip}
          style={{ padding: '6px 14px', fontSize: 12 }}
        >
          {roomId ? 'Close' : 'Skip'}
        </button>
      </div>

      {/* content */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '90px 40px 60px',
          zIndex: 2,
        }}
      >
        <div
          className="fade-up"
          key={step}
          style={{
            width: 960,
            maxWidth: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          {step === 0 && <StepTheme theme={theme} setTheme={setThemeLocal} />}
          {step === 1 && <StepName theme={theme} name={name} setName={setName} />}
          {step === 2 && (
            <StepInvite
              theme={theme}
              name={name}
              code={joinCode}
              creating={creating}
              error={error}
            />
          )}

          {/* error message (for step 0/1) */}
          {error && step !== 2 && (
            <div
              style={{
                marginTop: 20,
                padding: '9px 14px',
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

          {/* nav buttons */}
          <div style={{ display: 'flex', gap: 12, marginTop: 40 }}>
            {step > 0 && !roomId && (
              <button
                type="button"
                className="ghost-btn"
                onClick={back}
                style={{ padding: '12px 22px', fontSize: 13 }}
              >
                Back
              </button>
            )}
            <button
              type="button"
              className="gold-btn"
              onClick={next}
              disabled={creating || (step === 1 && !name.trim())}
              style={{
                padding: '12px 24px',
                fontSize: 13,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              {creating
                ? 'Opening…'
                : step < 2
                ? 'Continue'
                : 'Open the door'}
              {!creating && <I.arrow s={14} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
