import { app, BrowserWindow, shell } from "electron";
import { autoUpdater } from "electron-updater";
import * as path from "path";

// This is the "main process" - it controls the application lifecycle
// Think of it as the "manager" that creates and controls windows

let mainWindow: BrowserWindow | null = null;

// Configure auto-updater for GitHub releases
autoUpdater.setFeedURL({
  provider: "github",
  owner: "skander-fourati", // Your GitHub username
  repo: "zawali", // Your repository name
  private: true, // Set to true since you have a private repo
  token: process.env.GITHUB_TOKEN, // We'll set this up later
});

// Check for updates when app starts (after 3 seconds delay)
app.whenReady().then(() => {
  setTimeout(() => {
    autoUpdater.checkForUpdatesAndNotify();
  }, 3000);
});

// Auto-updater events (optional - for debugging)
autoUpdater.on("checking-for-update", () => {
  console.log("Checking for updates...");
});

autoUpdater.on("update-available", (info) => {
  console.log("Update available:", info.version);
});

autoUpdater.on("update-not-available", (info) => {
  console.log("Update not available:", info.version);
});

const createWindow = (): void => {
  // Create the browser window (this is your app's main window)
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false, // Security: don't expose Node.js to your React app
      contextIsolation: true, // Security: isolate contexts
      webSecurity: true, // Security: enable web security
    },
    titleBarStyle: "default", // Use system title bar
    show: false, // Don't show until ready (prevents flash)
  });

  // Determine what to load based on environment
  const isDev = process.env.NODE_ENV === "development";

  if (isDev) {
    // In development: load from Vite dev server
    mainWindow.loadURL("http://localhost:8080");
    // Open DevTools in development
    mainWindow.webContents.openDevTools();
  } else {
    // In production: load the built files
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  // Show window when ready (prevents white flash)
  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
  });

  // Handle external links (open in default browser, not in app)
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  // Clean up when window is closed
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
};

// App event handlers
app.whenReady().then(createWindow);

// Quit when all windows are closed (except on macOS)
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// Re-create window when dock icon is clicked (macOS behavior)
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Security: prevent navigation to external URLs
app.on("web-contents-created", (event, contents) => {
  contents.on("will-navigate", (navigationEvent, navigationURL) => {
    const parsedUrl = new URL(navigationURL);

    if (
      parsedUrl.origin !== "http://localhost:8080" &&
      parsedUrl.origin !== "file://"
    ) {
      navigationEvent.preventDefault();
      shell.openExternal(navigationURL);
    }
  });
});
