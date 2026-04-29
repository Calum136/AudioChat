export default function WindowControls() {
  const api = window.electronAPI;
  if (!api?.isElectron) return null;

  return (
    <div className="window-controls" style={{ WebkitAppRegion: 'no-drag' }}>
      <button
        className="wc-btn wc-minimize"
        onClick={() => api.minimizeWindow()}
        title="Minimize"
      >
        <svg width="10" height="1" viewBox="0 0 10 1" fill="currentColor">
          <rect width="10" height="1" />
        </svg>
      </button>
      <button
        className="wc-btn wc-maximize"
        onClick={() => api.maximizeWindow()}
        title="Maximize"
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.2">
          <rect x="0.6" y="0.6" width="8.8" height="8.8" />
        </svg>
      </button>
      <button
        className="wc-btn wc-close"
        onClick={() => api.closeWindow()}
        title="Close"
      >
        <svg width="10" height="10" viewBox="0 0 10 10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
          <line x1="1" y1="1" x2="9" y2="9" />
          <line x1="9" y1="1" x2="1" y2="9" />
        </svg>
      </button>
    </div>
  );
}
