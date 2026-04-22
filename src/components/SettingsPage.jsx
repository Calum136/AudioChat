import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useAudioSettingsStore } from '../stores/audioSettingsStore';
import AvatarEditor from './AvatarEditor';
import ConfirmDialog from './ConfirmDialog';
import { Aurora } from './design';
import { playJoinSound } from '../lib/sounds';

const TABS = [
  { id: 'account', label: 'Account' },
  { id: 'avatar', label: 'Avatar' },
  { id: 'audio', label: 'Audio' },
  { id: 'appearance', label: 'Appearance' },
];

// ========== Section header used at top of every tab ==========

function SectionHeader({ eyebrow, title, blurb }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div className="eyebrow" style={{ marginBottom: 8 }}>{eyebrow}</div>
      <div className="title-xl" style={{ fontSize: 28, marginBottom: 6 }}>{title}</div>
      {blurb && (
        <div style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.5 }}>
          {blurb}
        </div>
      )}
    </div>
  );
}

// ========== Shared field primitives ==========

function FieldLabel({ children, right }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: 11,
        color: 'var(--text-muted)',
        fontWeight: 600,
        marginBottom: 8,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
      }}
    >
      <span>{children}</span>
      {right}
    </div>
  );
}

function Slider({ label, value, onChange, min = 0, max = 1, step = 0.05, unit = '%', rightSlot }) {
  const pct = Math.round(((value - min) / (max - min)) * 100);
  const display = unit === '%' ? `${Math.round(value * 100)}%` : `${value}${unit}`;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>{label}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="mono" style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            {display}
          </span>
          {rightSlot}
        </div>
      </div>
      <div style={{ position: 'relative', height: 18, display: 'flex', alignItems: 'center' }}>
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            height: 6,
            borderRadius: 3,
            background: 'rgba(255,255,255,0.05)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 0,
            width: `${pct}%`,
            height: 6,
            borderRadius: 3,
            background: 'linear-gradient(90deg, rgba(232,168,56,0.6), var(--gold))',
            boxShadow: '0 0 12px rgba(232,168,56,0.35)',
            pointerEvents: 'none',
          }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          style={{
            position: 'relative',
            width: '100%',
            height: 18,
            background: 'transparent',
            appearance: 'none',
            WebkitAppearance: 'none',
            cursor: 'pointer',
            zIndex: 1,
          }}
          className="sq-slider"
        />
      </div>
    </div>
  );
}

function Toggle({ label, desc, on, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>{label}</div>
        {desc && (
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>{desc}</div>
        )}
      </div>
      <button
        type="button"
        onClick={() => onChange(!on)}
        style={{
          width: 40,
          height: 22,
          borderRadius: 11,
          background: on ? 'rgba(232,168,56,0.35)' : 'rgba(255,255,255,0.08)',
          border: on
            ? '1px solid rgba(232,168,56,0.5)'
            : '1px solid rgba(255,255,255,0.08)',
          position: 'relative',
          transition: 'all 160ms',
          boxShadow: on ? '0 0 12px rgba(232,168,56,0.25)' : 'none',
          cursor: 'pointer',
          padding: 0,
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: 2,
            left: on ? 20 : 2,
            width: 16,
            height: 16,
            borderRadius: '50%',
            background: on ? 'var(--gold)' : 'var(--text-secondary)',
            transition: 'left 180ms ease',
          }}
        />
      </button>
    </div>
  );
}

// ========== Account tab ==========

function AccountTab() {
  const user = useAuthStore((s) => s.user);
  const updateDisplayName = useAuthStore((s) => s.updateDisplayName);
  const updateEmail = useAuthStore((s) => s.updateEmail);
  const updatePassword = useAuthStore((s) => s.updatePassword);
  const deleteAccount = useAuthStore((s) => s.deleteAccount);
  const signOut = useAuthStore((s) => s.signOut);

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [nameMsg, setNameMsg] = useState(null);
  const [emailMsg, setEmailMsg] = useState(null);
  const [passMsg, setPassMsg] = useState(null);
  const [saving, setSaving] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleNameSave = async () => {
    if (!displayName.trim() || displayName.trim().length > 20) return;
    setSaving('name');
    const err = await updateDisplayName(displayName.trim());
    setSaving('');
    setNameMsg(
      err ? { type: 'error', text: err.message } : { type: 'success', text: 'Display name updated' }
    );
    setTimeout(() => setNameMsg(null), 3000);
  };

  const handleEmailSave = async () => {
    if (!email.trim()) return;
    setSaving('email');
    const err = await updateEmail(email.trim());
    setSaving('');
    setEmailMsg(
      err
        ? { type: 'error', text: err.message }
        : { type: 'success', text: 'Confirmation sent to new email' }
    );
    setTimeout(() => setEmailMsg(null), 3000);
  };

  const handlePasswordSave = async () => {
    if (!newPassword || newPassword.length < 6) {
      setPassMsg({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }
    setSaving('pass');
    const err = await updatePassword(newPassword);
    setSaving('');
    if (err) {
      setPassMsg({ type: 'error', text: err.message });
    } else {
      setPassMsg({ type: 'success', text: 'Password updated' });
      setNewPassword('');
    }
    setTimeout(() => setPassMsg(null), 3000);
  };

  const msgStyle = (type) => ({
    fontSize: 12,
    marginTop: 8,
    color: type === 'error' ? '#f2a4b0' : '#9ce8b0',
  });

  return (
    <>
      <SectionHeader
        eyebrow="Account"
        title={user?.displayName || 'Your account'}
        blurb="Display name, email, and password. Sign out or delete your account."
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, maxWidth: 720 }}>
        {/* Display name */}
        <div>
          <FieldLabel>Display name</FieldLabel>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              className="sq-input"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={20}
              placeholder="1–20 characters"
            />
            <button
              type="button"
              className="gold-btn"
              onClick={handleNameSave}
              disabled={saving === 'name' || !displayName.trim()}
              style={{ whiteSpace: 'nowrap', padding: '10px 14px', fontSize: 12 }}
            >
              {saving === 'name' ? 'Saving…' : 'Save'}
            </button>
          </div>
          {nameMsg && <div style={msgStyle(nameMsg.type)}>{nameMsg.text}</div>}
        </div>

        {/* Email */}
        <div>
          <FieldLabel>Email</FieldLabel>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              className="sq-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={user?.email || 'you@sidequest.gg'}
            />
            <button
              type="button"
              className="gold-btn"
              onClick={handleEmailSave}
              disabled={saving === 'email' || !email.trim()}
              style={{ whiteSpace: 'nowrap', padding: '10px 14px', fontSize: 12 }}
            >
              {saving === 'email' ? 'Saving…' : 'Update'}
            </button>
          </div>
          {emailMsg && <div style={msgStyle(emailMsg.type)}>{emailMsg.text}</div>}
        </div>

        {/* Password */}
        <div style={{ gridColumn: '1 / -1' }}>
          <FieldLabel>Change password</FieldLabel>
          <div style={{ display: 'flex', gap: 8, maxWidth: 460 }}>
            <input
              className="sq-input"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password (min 6 chars)"
              minLength={6}
              autoComplete="new-password"
            />
            <button
              type="button"
              className="gold-btn"
              onClick={handlePasswordSave}
              disabled={saving === 'pass' || !newPassword}
              style={{ whiteSpace: 'nowrap', padding: '10px 14px', fontSize: 12 }}
            >
              {saving === 'pass' ? 'Saving…' : 'Change'}
            </button>
          </div>
          {passMsg && <div style={msgStyle(passMsg.type)}>{passMsg.text}</div>}
        </div>
      </div>

      {/* Session + danger zone */}
      <div style={{ marginTop: 34, maxWidth: 720 }}>
        <div className="title-md" style={{ fontSize: 14, marginBottom: 12 }}>
          Session
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '14px 16px',
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 10,
          }}
        >
          <span className="dot online" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>This device · Signed in</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {user?.email || 'Active session'}
            </div>
          </div>
          <button
            type="button"
            className="ghost-btn"
            onClick={signOut}
            style={{ fontSize: 12, padding: '7px 12px' }}
          >
            Sign out
          </button>
        </div>
      </div>

      <div style={{ marginTop: 34, maxWidth: 720 }}>
        <div className="eyebrow" style={{ marginBottom: 10, color: '#f2a4b0' }}>
          Danger zone
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '14px 16px',
            background: 'rgba(232,93,117,0.06)',
            border: '1px solid rgba(232,93,117,0.22)',
            borderRadius: 10,
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Delete account</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>
              Permanently removes your profile, rooms, and all data. Cannot be undone.
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            style={{
              padding: '8px 14px',
              fontSize: 12,
              fontWeight: 600,
              color: '#f2a4b0',
              background: 'rgba(232,93,117,0.08)',
              border: '1px solid rgba(232,93,117,0.35)',
              borderRadius: 8,
              cursor: 'pointer',
            }}
          >
            Delete
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete your account?"
        message="This will permanently delete your profile, rooms, and all data. This cannot be undone."
        confirmLabel="Delete Account"
        variant="danger"
        onConfirm={async () => {
          await deleteAccount();
          setShowDeleteConfirm(false);
        }}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </>
  );
}

// ========== Audio tab ==========

function AudioTab() {
  const masterVolume = useAudioSettingsStore((s) => s.masterVolume);
  const sfxVolume = useAudioSettingsStore((s) => s.sfxVolume);
  const voiceVolume = useAudioSettingsStore((s) => s.voiceVolume);
  const micInputVolume = useAudioSettingsStore((s) => s.micInputVolume);
  const sfxEnabled = useAudioSettingsStore((s) => s.sfxEnabled);
  const setMasterVolume = useAudioSettingsStore((s) => s.setMasterVolume);
  const setSfxVolume = useAudioSettingsStore((s) => s.setSfxVolume);
  const setVoiceVolume = useAudioSettingsStore((s) => s.setVoiceVolume);
  const setMicInputVolume = useAudioSettingsStore((s) => s.setMicInputVolume);
  const setSfxEnabled = useAudioSettingsStore((s) => s.setSfxEnabled);

  return (
    <>
      <SectionHeader
        eyebrow="Audio"
        title="Sound settings"
        blurb="Input, output, and how loud the room feels."
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 620 }}>
        <Slider label="Master volume" value={masterVolume} onChange={setMasterVolume} />
        <Slider label="Voice volume" value={voiceVolume} onChange={setVoiceVolume} />
        <Slider label="Mic input" value={micInputVolume} onChange={setMicInputVolume} />

        <div
          style={{
            padding: 16,
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 12,
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          <Toggle
            label="Sound effects"
            desc="Join, leave, knock, and other ambient chirps."
            on={sfxEnabled}
            onChange={setSfxEnabled}
          />
          <Slider
            label="SFX volume"
            value={sfxVolume}
            onChange={setSfxVolume}
            rightSlot={
              <button
                type="button"
                className="ghost-btn"
                onClick={() => playJoinSound()}
                style={{ fontSize: 11, padding: '4px 10px' }}
              >
                Test
              </button>
            }
          />
        </div>
      </div>
    </>
  );
}

// ========== Avatar tab — delegates to existing AvatarEditor ==========

function AvatarTab() {
  return (
    <>
      <SectionHeader
        eyebrow="Profile"
        title="Your avatar"
        blurb="Pixel you. Your face in every room, every chat, every friend list."
      />
      <div
        style={{
          padding: 24,
          borderRadius: 'var(--r-lg)',
          border: '1px solid rgba(255,255,255,0.07)',
          background: 'rgba(255,255,255,0.02)',
        }}
      >
        <AvatarEditor />
      </div>
    </>
  );
}

// ========== Appearance tab ==========

function AppearanceTab() {
  const [reducedMotion, setReducedMotion] = useState(
    () => localStorage.getItem('sq-reduced-motion') === 'true'
  );
  const [uiScale, setUiScale] = useState(
    () => localStorage.getItem('sq-ui-scale') || 'medium'
  );

  const toggleReducedMotion = (next) => {
    setReducedMotion(next);
    localStorage.setItem('sq-reduced-motion', String(next));
    document.documentElement.classList.toggle('reduced-motion', next);
  };

  const handleUiScale = (scale) => {
    setUiScale(scale);
    localStorage.setItem('sq-ui-scale', scale);
    document.documentElement.dataset.uiScale = scale;
  };

  return (
    <>
      <SectionHeader
        eyebrow="Appearance"
        title="How Sidequest looks"
        blurb="Ambient details that make the lounge feel yours."
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 620 }}>
        <div
          style={{
            padding: 16,
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 12,
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          <Toggle
            label="Reduce motion"
            desc="Disable fade-ups, aurora drifts, and other animations."
            on={reducedMotion}
            onChange={toggleReducedMotion}
          />
        </div>

        <div>
          <FieldLabel>UI scale</FieldLabel>
          <div style={{ display: 'flex', gap: 8 }}>
            {['small', 'medium', 'large'].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => handleUiScale(s)}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  fontSize: 12,
                  fontWeight: 600,
                  borderRadius: 8,
                  cursor: 'pointer',
                  transition: 'all 140ms ease',
                  background:
                    uiScale === s
                      ? 'rgba(232,168,56,0.12)'
                      : 'rgba(255,255,255,0.03)',
                  border:
                    uiScale === s
                      ? '1px solid rgba(232,168,56,0.35)'
                      : '1px solid rgba(255,255,255,0.06)',
                  color: uiScale === s ? '#f2d78a' : 'var(--text-secondary)',
                }}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

// ========== Main page ==========

export default function SettingsPage({ onClose }) {
  const [tab, setTab] = useState('account');

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(6,6,16,0.7)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
      }}
    >
      <div
        className="fade-up"
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          maxWidth: 1240,
          maxHeight: 780,
          background: 'rgba(12,12,24,0.85)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 'var(--r-xl)',
          boxShadow: '0 40px 120px rgba(0,0,0,0.6)',
          display: 'grid',
          gridTemplateColumns: '240px 1fr',
          overflow: 'hidden',
        }}
      >
        <Aurora level="whisper" />

        {/* Left sidebar */}
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            borderRight: '1px solid rgba(255,255,255,0.05)',
            padding: '24px 16px',
            display: 'flex',
            flexDirection: 'column',
            background: 'rgba(6,6,16,0.3)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '0 10px 18px',
            }}
          >
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
                fontSize: 14,
                letterSpacing: '0.02em',
              }}
            >
              Sidequest
            </span>
          </div>

          <div className="eyebrow" style={{ padding: '6px 10px 10px' }}>
            Settings
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                style={{
                  padding: '9px 12px',
                  borderRadius: 8,
                  textAlign: 'left',
                  fontSize: 13,
                  fontWeight: 500,
                  background:
                    tab === t.id ? 'rgba(232,168,56,0.1)' : 'transparent',
                  color: tab === t.id ? '#f2d78a' : 'var(--text-secondary)',
                  border:
                    tab === t.id
                      ? '1px solid rgba(232,168,56,0.28)'
                      : '1px solid transparent',
                  transition: 'all 140ms ease',
                  cursor: 'pointer',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="ghost-btn"
            onClick={onClose}
            style={{ fontSize: 12, padding: '8px 10px', marginTop: 12 }}
          >
            Back to room
          </button>
        </div>

        {/* Content area */}
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            overflow: 'auto',
            padding: '30px 40px',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              position: 'absolute',
              top: 16,
              right: 18,
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'var(--text-secondary)',
              fontSize: 18,
              lineHeight: 1,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2,
            }}
          >
            ×
          </button>

          {tab === 'account' && <AccountTab />}
          {tab === 'avatar' && <AvatarTab />}
          {tab === 'audio' && <AudioTab />}
          {tab === 'appearance' && <AppearanceTab />}
        </div>
      </div>
    </div>
  );
}
