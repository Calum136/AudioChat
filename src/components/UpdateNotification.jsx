import { useState, useEffect } from 'react';

export default function UpdateNotification() {
  const [state, setState] = useState(null); // null | 'checking' | 'not-available' | 'available' | 'downloading' | 'ready' | 'error'
  const [version, setVersion] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const api = window.electronAPI;
    if (!api?.isElectron) return;

    api.onUpdateChecking?.(() => setState('checking'));
    api.onUpdateNotAvailable?.(() => {
      setState('not-available');
      setTimeout(() => setState(null), 3000);
    });
    api.onUpdateAvailable?.((info) => {
      setVersion(info.version);
      setState('available');
    });
    api.onUpdateDownloaded((info) => {
      setVersion(info.version);
      setState('ready');
    });
    api.onUpdateError?.((info) => {
      setErrorMsg(info.message);
      setState('error');
    });
  }, []);

  if (!state || state === null) return null;

  if (state === 'checking') {
    return (
      <div className="update-toast update-toast-info">
        <span>Checking for updates…</span>
      </div>
    );
  }

  if (state === 'not-available') {
    return (
      <div className="update-toast update-toast-info">
        <span>App is up to date</span>
      </div>
    );
  }

  if (state === 'available') {
    return (
      <div className="update-toast update-toast-info">
        <span>Downloading update {version}…</span>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="update-toast update-toast-error">
        <span>Update error: {errorMsg}</span>
        <button className="update-dismiss-btn" onClick={() => setState(null)}>✕</button>
      </div>
    );
  }

  if (state === 'ready') {
    return (
      <div className="update-toast">
        <span>Update {version} ready</span>
        <button className="update-restart-btn" onClick={() => window.electronAPI.restartApp()}>
          Restart now
        </button>
        <button className="update-dismiss-btn" onClick={() => setState(null)}>
          Later
        </button>
      </div>
    );
  }

  return null;
}
