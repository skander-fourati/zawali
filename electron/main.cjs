// Replace your existing showDownloadDialog function with this enhanced version

// Enhanced download dialog with release notes preview
function showDownloadDialog(version, releaseInfo = null) {
  if (!mainWindow) return;

  // Create release notes preview for the dialog
  let shortNotes = "New features and improvements are ready!";
  let hasReleaseNotes = false;

  if (releaseInfo && releaseInfo.releaseNotes) {
    // Extract key highlights from release notes (first few bullet points)
    const notes = releaseInfo.releaseNotes;
    
    // Look for bullet points or major features
    const bulletPoints = notes.match(/^[\s]*[-•*]\s*(.+)$/gm);
    if (bulletPoints && bulletPoints.length > 0) {
      shortNotes = bulletPoints.slice(0, 3).join('\n') + '\n\n...and more zawali goodness!';
      hasReleaseNotes = true;
    } else {
      // Fallback: take first few lines
      const lines = notes.split('\n').filter(line => line.trim().length > 0);
      if (lines.length > 2) {
        shortNotes = lines.slice(0, 3).join('\n') + '\n\n...and more!';
        hasReleaseNotes = true;
      }
    }
  } else {
    // Default zawali-themed message when we don't have release notes
    shortNotes = "🎉 New Portfolio features to help you grow from zawali to wealthy!\n📊 Better investment tracking and analytics\n💰 Your financial journey just got an upgrade!";
  }

  // Create the dialog with three options
  const buttons = hasReleaseNotes 
    ? ["Download Now", "View Full Release Notes", "Later"]
    : ["Download Now", "View on GitHub", "Later"];

  const choice = dialog.showMessageBoxSync(mainWindow, {
    type: "info",
    title: `🎉 Zawali ${version} - Marhaba to New Features!`,
    message: `What's new for you, ya zawali:`,
    detail: shortNotes + "\n\nReady to upgrade your financial game?",
    buttons: buttons,
    defaultId: 0,
    cancelId: 2,
    icon: path.join(__dirname, '../public/favicon/web-app-manifest-512x512.png') // Your app icon
  });

  if (choice === 0) {
    // Download Now
    console.log("🌐 Auto-updater: Opening download link for user");
    shell.openExternal(
      `https://github.com/skander-fourati/zawali/releases/latest/download/Zawali-${version}-universal.dmg`
    );
  } else if (choice === 1) {
    // View Full Release Notes or View on GitHub
    console.log("📋 Auto-updater: Opening full release notes");
    shell.openExternal(
      `https://github.com/skander-fourati/zawali/releases/latest`
    );
  } else {
    // Later
    console.log("⏰ Auto-updater: User chose to download later");
  }
}

// Enhanced function to fetch release notes from GitHub
async function fetchReleaseNotes(version) {
  try {
    console.log(`🔍 Fetching release notes for version ${version}...`);
    
    const response = await fetch(
      `https://api.github.com/repos/skander-fourati/zawali/releases/latest`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Zawali-App'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`GitHub API returned ${response.status}`);
    }
    
    const release = await response.json();
    
    return {
      version: release.tag_name,
      releaseNotes: release.body,
      publishedAt: release.published_at,
      htmlUrl: release.html_url
    };
    
  } catch (error) {
    console.log("⚠️ Could not fetch release notes from GitHub:", error.message);
    return null;
  }
}

// Updated auto-updater event handler
autoUpdater.on("update-downloaded", async (info) => {
  console.log("✅ Auto-updater: Update downloaded!", info.version);
  
  // Try to fetch detailed release notes
  const releaseInfo = await fetchReleaseNotes(info.version);
  
  if (releaseInfo) {
    console.log("📝 Auto-updater: Retrieved release notes from GitHub");
    showDownloadDialog(info.version, releaseInfo);
  } else {
    console.log("📝 Auto-updater: Using fallback dialog (no release notes)");
    showDownloadDialog(info.version, null);
  }
});

// Optional: Add a manual "Check for Updates" menu item
const { Menu } = require('electron');

function createMenuTemplate() {
  const template = [
    {
      label: 'Zawali',
      submenu: [
        {
          label: 'About Zawali',
          role: 'about'
        },
        {
          label: 'Check for Updates...',
          click: async () => {
            console.log('🔍 Manual update check requested');
            try {
              await autoUpdater.checkForUpdatesAndNotify();
            } catch (error) {
              console.error('❌ Manual update check failed:', error);
              
              // Show error dialog
              dialog.showMessageBox(mainWindow, {
                type: 'info',
                title: 'Update Check',
                message: 'Unable to check for updates',
                detail: 'Please check your internet connection and try again later.',
                buttons: ['OK']
              });
            }
          }
        },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'close' }
      ]
    }
  ];

  return template;
}

// Add this to your createWindow function, after the window is created:
// const menu = Menu.buildFromTemplate(createMenuTemplate());
// Menu.setApplicationMenu(menu);