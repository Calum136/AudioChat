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
    titleBarStyle: 'hidden',
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

  // Window control handlers
  ipcMain.removeAllListeners('minimize-window');
  ipcMain.removeAllListeners('maximize-window');
  ipcMain.removeAllListeners('close-window');
  ipcMain.on('minimize-window', () => win.minimize());
  ipcMain.on('maximize-window', () => {
    if (win.isMaximized()) win.unmaximize(); else win.maximize();
  });
  ipcMain.on('close-window', () => win.close());

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

function sendToWindow(channel, payload) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, payload);
  }
}

function setupAutoUpdater() {
  if (isDev) return;

  try {
    const GH_TOKEN = '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';
    process.env.GH_TOKEN = GH_TOKEN;

    const { autoUpdater } = require('electron-updater');

    autoUpdater.autoDownload = true;
    autoUpdater.autoInstallOnAppQuit = true;
    autoUpdater.requestHeaders = { Authorization: `token ${GH_TOKEN}` };

    autoUpdater.on('checking-for-update', () => sendToWindow('update-checking'));
    autoUpdater.on('update-not-available', () => sendToWindow('update-not-available'));
    autoUpdater.on('update-available', (info) => sendToWindow('update-available', { version: info.version }));
    autoUpdater.on('update-downloaded', (info) => sendToWindow('update-downloaded', { version: info.version }));
    autoUpdater.on('error', (err) => {
      console.error('[auto-updater]', err.message);
      sendToWindow('update-error', { message: err.message });
    });

    ipcMain.on('restart-app', () => autoUpdater.quitAndInstall());

    autoUpdater.checkForUpdates().catch((err) => {
      console.error('[auto-updater] checkForUpdates rejected:', err.message);
      sendToWindow('update-error', { message: err.message });
    });

  } catch (err) {
    console.error('[auto-updater] init failed:', err.message);
    sendToWindow('update-error', { message: 'Updater init: ' + err.message });
  }
}

// ======== App Lifecycle ========

app.whenReady().then(() => {
  createWindow();
  mainWindow.webContents.once('did-finish-load', () => {
    setupAutoUpdater();
  });

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
