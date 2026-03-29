import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useAudioSettingsStore } from '../stores/audioSettingsStore';
import AvatarEditor from './AvatarEditor';
import ConfirmDialog from './ConfirmDialog';
import { playJoinSound } from '../lib/sounds';

const TABS = [
  { id: 'account', label: 'Account' },
  { id: 'avatar', label: 'Avatar' },
  { id: 'audio', label: 'Audio' },
  { id: 'appearance', label: 'Appearance' },
];

function AccountSettings() {
  const user = useAuthStore((s) => s.user);
  const updateDisplayName = useAuthStore((s) => s.updateDisplayName);
  const updateEmail = useAuthStore((s) => s.updateEmail);
  const updatePassword = useAuthStore((s) => s.updatePassword);
  const deleteAccount = useAuthStore((s) => s.deleteAccount);
  const signOut = useAuthStore((s) => s.signOut);

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
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
    setNameMsg(err ? { type: 'error', text: err.message } : { type: 'success', text: 'Display name updated' });
    setTimeout(() => setNameMsg(null), 3000);
  };

  const handleEmailSave = async () => {
    if (!email.trim()) return;
    setSaving('email');
    const err = await updateEmail(email.trim());
    setSaving('');
    setEmailMsg(err ? { type: 'error', text: err.message } : { type: 'success', text: 'Confirmation sent to new email' });
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
      setCurrentPassword('');
      setNewPassword('');
    }
    setTimeout(() => setPassMsg(null), 3000);
  };

  return (
    <>
      <div className="settings-section">
        <span className="settings-section-title">Display Name</span>
        <div className="settings-row">
          <input
            className="settings-input"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={20}
            placeholder="1-20 characters"
          />
          <button
            className="settings-btn primary"
            onClick={handleNameSave}
            disabled={saving === 'name' || !displayName.trim()}
          >
            {saving === 'name' ? 'Saving...' : 'Save'}
          </button>
        </div>
        {nameMsg && <span className={`settings-${nameMsg.type}`}>{nameMsg.text}</span>}
      </div>

      <div className="settings-section">
        <span className="settings-section-title">Email Address</span>
        <div className="settings-row">
          <input
            className="settings-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="New email address"
          />
          <button
            className="settings-btn primary"
            onClick={handleEmailSave}
            disabled={saving === 'email' || !email.trim()}
          >
            {saving === 'email' ? 'Saving...' : 'Update'}
          </button>
        </div>
        {emailMsg && <span className={`settings-${emailMsg.type}`}>{emailMsg.text}</span>}
      </div>

      <div className="settings-section">
        <span className="settings-section-title">Change Password</span>
        <div className="settings-field">
          <input
            className="settings-input"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New password (min 6 chars)"
            minLength={6}
          />
        </div>
        <button
          className="settings-btn primary"
          onClick={handlePasswordSave}
          disabled={saving === 'pass' || !newPassword}
        >
          {saving === 'pass' ? 'Saving...' : 'Change Password'}
        </button>
        {passMsg && <span className={`settings-${passMsg.type}`}>{passMsg.text}</span>}
      </div>

      <div className="settings-section">
        <span className="settings-section-title">Session</span>
        <button className="settings-btn" onClick={signOut}>Sign Out</button>
      </div>

      <div className="settings-section">
        <span className="settings-section-title">Danger Zone</span>
        <button className="settings-btn danger" onClick={() => setShowDeleteConfirm(true)}>
          Delete Account
        </button>
      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete your account?"
        message="This will permanently delete your profile, rooms, and all data. This cannot be undone."
        confirmLabel="Delete Account"
        variant="danger"
        onConfirm={async () => { await deleteAccount(); setShowDeleteConfirm(false); }}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </>
  );
}

function VolumeSlider({ label, value, onChange, testFn }) {
  return (
    <div className="settings-volume-row">
      <span className="settings-volume-label">{label}</span>
      <input
        type="range"
        min="0"
        max="1"
        step="0.05"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="settings-slider"
      />
      <span className="settings-volume-value">{Math.round(value * 100)}%</span>
      {testFn && (
        <button className="settings-btn small" onClick={testFn}>Test</button>
      )}
    </div>
  );
}

function AudioSettings() {
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
      <div className="settings-section">
        <span className="settings-section-title">Master Volume</span>
        <VolumeSlider label="Master" value={masterVolume} onChange={setMasterVolume} />
      </div>

      <div className="settings-section">
        <span className="settings-section-title">Sound Effects</span>
        <div className="settings-toggle">
          <span className="settings-toggle-label">Enable sound effects</span>
          <button
            className={`settings-toggle-switch ${sfxEnabled ? 'on' : ''}`}
            onClick={() => setSfxEnabled(!sfxEnabled)}
          />
        </div>
        <VolumeSlider
          label="SFX Volume"
          value={sfxVolume}
          onChange={setSfxVolume}
          testFn={() => playJoinSound()}
        />
      </div>

      <div className="settings-section">
        <span className="settings-section-title">Voice Chat</span>
        <VolumeSlider label="Voice Volume" value={voiceVolume} onChange={setVoiceVolume} />
        <VolumeSlider label="Mic Input" value={micInputVolume} onChange={setMicInputVolume} />
      </div>
    </>
  );
}

function AppearanceSettings() {
  const [reducedMotion, setReducedMotion] = useState(
    () => localStorage.getItem('sq-reduced-motion') === 'true'
  );
  const [uiScale, setUiScale] = useState(
    () => localStorage.getItem('sq-ui-scale') || 'medium'
  );

  const toggleReducedMotion = () => {
    const next = !reducedMotion;
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
      <div className="settings-section">
        <span className="settings-section-title">Motion</span>
        <div className="settings-toggle">
          <span className="settings-toggle-label">Reduced motion</span>
          <button
            className={`settings-toggle-switch ${reducedMotion ? 'on' : ''}`}
            onClick={toggleReducedMotion}
          />
        </div>
      </div>

      <div className="settings-section">
        <span className="settings-section-title">UI Scale</span>
        <div className="settings-row">
          {['small', 'medium', 'large'].map((s) => (
            <button
              key={s}
              className={`settings-btn ${uiScale === s ? 'primary' : ''}`}
              onClick={() => handleUiScale(s)}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

export default function SettingsPage({ onClose }) {
  const [tab, setTab] = useState('account');

  return (
    <div className="settings-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="settings-panel">
        <nav className="settings-nav">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`settings-nav-btn ${tab === t.id ? 'active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
          <div className="settings-nav-divider" />
          <button className="settings-nav-btn" onClick={onClose}>
            Close
          </button>
        </nav>

        <div className="settings-content">
          <div className="settings-header">
            <h2>{TABS.find((t) => t.id === tab)?.label || 'Settings'}</h2>
            <button className="settings-close" onClick={onClose}>{'\u00D7'}</button>
          </div>

          {tab === 'account' && <AccountSettings />}
          {tab === 'avatar' && <AvatarEditor />}
          {tab === 'audio' && <AudioSettings />}
          {tab === 'appearance' && <AppearanceSettings />}
        </div>
      </div>
    </div>
  );
}
