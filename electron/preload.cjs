const { contextBridge, ipcRenderer } = require('electron');

// Expose a minimal API to the renderer
contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  platform: process.platform,

  // Window focus events (for presence reconnection)
  onWindowFocus: (cb) => ipcRenderer.on('window-focus', cb),
  onWindowBlur: (cb) => ipcRenderer.on('window-blur', cb),

  // Auto-update events
  onUpdateAvailable: (cb) => ipcRenderer.on('update-available', (_e, info) => cb(info)),
  onUpdateDownloaded: (cb) => ipcRenderer.on('update-downloaded', (_e, info) => cb(info)),
  restartApp: () => ipcRenderer.send('restart-app'),
});

// Add electron class to document as soon as DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  document.documentElement.classList.add('electron');
});
