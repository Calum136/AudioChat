const { contextBridge, ipcRenderer } = require('electron');

// Expose a minimal API to the renderer
contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  platform: process.platform,
});

// Add electron class to document as soon as DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  document.documentElement.classList.add('electron');
});
