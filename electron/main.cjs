const { app, BrowserWindow, shell, ipcMain } = require('electron');
const path = require('path');

const isDev = !app.isPackaged;

let mainWindow = null;

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'Sidequest',
    icon: path.join(__dirname, process.platform === 'win32' ? 'icon.ico' : 'icon.png'),
    backgroundColor: '#0a0a14',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false,
    },
    // Frameless with custom titlebar vibes
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#0f0f20',
      symbolColor: '#d8d8f0',
      height: 36,
    },
    autoHideMenuBar: true,
  });

  // Open external links in default browser
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Ctrl+Shift+I opens devtools in any build (for debugging)
  win.webContents.on('before-input-event', (_e, input) => {
    if (input.control && input.shift && input.key === 'I') {
      win.webContents.openDevTools();
    }
  });

  // Forward focus/blur to renderer for presence reconnection
  win.on('focus', () => win.webContents.send('window-focus'));
  win.on('blur', () => win.webContents.send('window-blur'));

  if (isDev) {
    win.loadURL('http://localhost:5173');
  } else {
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  mainWindow = win;
  return win;
}

// ======== Auto-Update ========

function setupAutoUpdater() {
  if (isDev) return;

  process.env.GH_TOKEN = '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';
  const { autoUpdater } = require('electron-updater');

  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('update-available', (info) => {
    if (mainWindow) {
      mainWindow.webContents.send('update-available', {
        version: info.version,
      });
    }
  });

  autoUpdater.on('update-downloaded', (info) => {
    if (mainWindow) {
      mainWindow.webContents.send('update-downloaded', {
        version: info.version,
      });
    }
  });

  autoUpdater.on('checking-for-update', () => {
    if (mainWindow) mainWindow.webContents.send('update-checking');
  });

  autoUpdater.on('update-not-available', () => {
    if (mainWindow) mainWindow.webContents.send('update-not-available');
  });

  autoUpdater.on('error', (err) => {
    console.error('[auto-updater] Error:', err.message);
    if (mainWindow) {
      mainWindow.webContents.send('update-error', { message: err.message });
    }
  });

  ipcMain.on('restart-app', () => {
    autoUpdater.quitAndInstall();
  });

  autoUpdater.checkForUpdates();
}

// ======== App Lifecycle ========

app.whenReady().then(() => {
  createWindow();
  setupAutoUpdater();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
