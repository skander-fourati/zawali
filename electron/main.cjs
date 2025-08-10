const { app, BrowserWindow, shell, ipcMain, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');

// This is the "main process" - it controls the application lifecycle
let mainWindow = null;

// Configure auto-updater for GitHub releases
autoUpdater.setFeedURL({
  provider: 'github',
  owner: 'skander-fourati',
  repo: 'zawali',
  private: false
});

// Check for updates when app starts (after 3 seconds delay)
app.whenReady().then(() => {
  setTimeout(() => {
    console.log('🚀 Auto-updater: Starting update check...');
    try {
      autoUpdater.checkForUpdatesAndNotify();
    } catch (error) {
      console.error('❌ Auto-updater: Failed to check for updates:', error);
    }
  }, 3000);
});

// Auto-updater events (with better logging)
autoUpdater.on('checking-for-update', () => {
  console.log('🔍 Auto-updater: Checking for updates...');
});

autoUpdater.on('update-available', (info) => {
  console.log('🎉 Auto-updater: Update available!', info.version);
});

autoUpdater.on('update-not-available', (info) => {
  console.log('ℹ️ Auto-updater: No updates available. Current:', info.version);
});

autoUpdater.on('error', (error) => {
  console.error('❌ Auto-updater error:', error);
  
  // If code signing error, show manual update dialog
  if (error.message.includes('Could not get code signature')) {
    console.log('📋 Auto-updater: Showing manual update dialog due to code signing...');
    showManualUpdateDialog();
  }
});

autoUpdater.on('download-progress', (progressObj) => {
  console.log(`📥 Auto-updater: Download ${Math.round(progressObj.percent)}%`);
});

autoUpdater.on('update-downloaded', (info) => {
  console.log('✅ Auto-updater: Update downloaded!', info.version);
  
  // Show dialog asking user if they want to install
  showUpdateReadyDialog(info.version);
});

// Show dialog when update is ready to install
function showUpdateReadyDialog(version) {
  if (!mainWindow) return;
  
  const choice = dialog.showMessageBoxSync(mainWindow, {
    type: 'info',
    title: 'Update Ready',
    message: `Zawali ${version} is ready to install!`,
    detail: 'The update has been downloaded. Would you like to restart and install it now?',
    buttons: ['Install Now', 'Later'],
    defaultId: 0
  });

  if (choice === 0) {
    console.log('🔄 Auto-updater: User chose to install update now');
    try {
      autoUpdater.quitAndInstall();
    } catch (error) {
      console.error('❌ Auto-updater: Failed to install update:', error);
      showManualUpdateDialog();
    }
  } else {
    console.log('⏰ Auto-updater: User chose to install update later');
  }
}

// Show manual update dialog when auto-install fails
function showManualUpdateDialog() {
  if (!mainWindow) return;
  
  const choice = dialog.showMessageBoxSync(mainWindow, {
    type: 'info',
    title: 'Update Available',
    message: 'A new version of Zawali is available!',
    detail: 'Please download the latest version from GitHub releases to get the newest features and fixes.',
    buttons: ['Open GitHub Releases', 'Later'],
    defaultId: 0
  });

  if (choice === 0) {
    shell.openExternal('https://github.com/skander-fourati/zawali/releases/latest');
  }
}

const createWindow = () => {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
    },
    titleBarStyle: 'default',
    show: false,
  });

  // Determine what to load based on environment
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  
  if (isDev) {
    // In development: load from Vite dev server
    mainWindow.loadURL('http://localhost:8080');
    // Open DevTools in development
    mainWindow.webContents.openDevTools();
  } else {
    // In production: load the built files
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    console.log('✅ Zawali Finance app loaded successfully!');
    console.log('📦 App version:', app.getVersion());
    console.log('🔄 Auto-updater configured for: skander-fourati/zawali');
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Clean up when window is closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
};

// App event handlers
app.whenReady().then(createWindow);

// Quit when all windows are closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Re-create window when dock icon is clicked (macOS)
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Security: prevent navigation to external URLs
app.on('web-contents-created', (event, contents) => {
  contents.on('will-navigate', (navigationEvent, navigationURL) => {
    const parsedUrl = new URL(navigationURL);
    
    if (parsedUrl.origin !== 'http://localhost:8080' && parsedUrl.origin !== 'file://') {
      navigationEvent.preventDefault();
      shell.openExternal(navigationURL);
    }
  });
});