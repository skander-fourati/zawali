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

// Clean up auto-updater logging
autoUpdater.logger = null; // Disable verbose logging

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
  console.error('❌ Auto-updater error:', error.message);
  
  // If code signing error, try to continue anyway - sometimes it still works
  if (error.message.includes('Could not get code signature')) {
    console.log('⚠️ Auto-updater: Code signing issue, but update might still work...');
    // Don't show error dialog immediately - wait to see if update-downloaded fires
  }
});

autoUpdater.on('download-progress', (progressObj) => {
  // Only show progress every 25% to reduce spam
  const percent = Math.round(progressObj.percent);
  if (percent % 25 === 0 || percent > 95) {
    console.log(`📥 Auto-updater: Download ${percent}%`);
  }
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
    attemptAutoInstall(version);
  } else {
    console.log('⏰ Auto-updater: User chose to install update later');
  }
}

// Attempt auto-install with timeout fallback
function attemptAutoInstall(version) {
  console.log('🔧 Auto-updater: Attempting automatic installation...');
  
  // Set a timeout to detect if quitAndInstall() fails silently
  const timeoutId = setTimeout(() => {
    console.log('⏰ Auto-updater: Auto-install timed out, showing manual option');
    showSimpleUpdateDialog(version);
  }, 5000); // 5 second timeout

  try {
    // Try auto-install first - sometimes works even with code signing issues
    autoUpdater.quitAndInstall();
    
    // If we get here, clear the timeout (app should be restarting)
    clearTimeout(timeoutId);
  } catch (error) {
    console.error('❌ Auto-updater: Auto-install failed:', error.message);
    clearTimeout(timeoutId);
    showSimpleUpdateDialog(version);
  }
}

// Show simple update dialog when auto-install fails  
function showSimpleUpdateDialog(version) {
  if (!mainWindow) return;
  
  const choice = dialog.showMessageBoxSync(mainWindow, {
    type: 'info',
    title: 'Download Required',
    message: `Please download Zawali ${version} manually`,
    detail: `The automatic update couldn't install. Click "Download" to get the latest version from GitHub.`,
    buttons: ['Download Update', 'Maybe Later'],
    defaultId: 0
  });

  if (choice === 0) {
    console.log('🌐 Auto-updater: Opening download link for user');
    // Open the direct download link for the DMG
    shell.openExternal(`https://github.com/skander-fourati/zawali/releases/latest/download/Zawali-${version}-universal.dmg`);
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