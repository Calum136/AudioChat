import { useState, useEffect } from 'react';

export default function UpdateNotification() {
  const [updateReady, setUpdateReady] = useState(false);
  const [version, setVersion] = useState('');

  useEffect(() => {
    const api = window.electronAPI;
    if (!api?.isElectron) return;

    api.onUpdateDownloaded((info) => {
      setVersion(info.version);
      setUpdateReady(true);
    });
  }, []);

  if (!updateReady) return null;

  return (
    <div className="update-toast">
      <span>Update {version} ready</span>
      <button
        className="update-restart-btn"
        onClick={() => window.electronAPI.restartApp()}
      >
        Restart now
      </button>
      <button
        className="update-dismiss-btn"
        onClick={() => setUpdateReady(false)}
      >
        Later
      </button>
    </div>
  );
}
