const { app, BrowserWindow, ipcMain, dialog, protocol, net } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: 'pgr-asset', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true } }
]);

let mainWindow = null;
const settingsFile = path.join(app.getPath('userData'), 'pgr_settings.json');

// Default settings
let settings = {
  playerName: 'Commandant',
  voiceLang: 'ja',
  cliPath: '/home/deist/.local/bin/pgr-assets',
  paths: {
    data: '/home/deist/Downloads/Work/PGR_Data/EN/bytes/client/movie',
    audio: '/home/deist/Downloads/Work/pgr_extracted/audio',
    assets: '/home/deist/Downloads/Work/pgr_extracted/assets'
  }
};

// Load settings from file
function loadSettings() {
  try {
    if (fs.existsSync(settingsFile)) {
      const data = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
      settings = { ...settings, ...data, paths: { ...settings.paths, ...data.paths } };
    }
  } catch (err) {
    console.error('Failed to load settings:', err);
  }
}

// Save settings to file
function saveSettings(newSettings) {
  try {
    settings = { ...settings, ...newSettings, paths: { ...settings.paths, ...newSettings.paths } };
    fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Failed to save settings:', err);
    return false;
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false // allow iframe embedding of youtube, etc.
    }
  });

  loadSettings();

  // In development, load the Vite dev server URL.
  // In production, load the built index.html.
  if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
    mainWindow.loadURL('http://localhost:5174');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Register protocol handler to serve local files securely
app.whenReady().then(() => {
  protocol.handle('pgr-asset', (request) => {
    try {
      const parsed = new URL(request.url);
      const type = parsed.host; // 'data', 'audio', or 'assets'
      const subpath = decodeURIComponent(parsed.pathname); // path inside type folder
      
      const basePath = settings.paths[type];
      if (!basePath) {
        return new Response('Invalid asset type: ' + type, { status: 400 });
      }
      
      const absolutePath = path.join(basePath, subpath);
      if (!fs.existsSync(absolutePath)) {
        return new Response('File not found: ' + absolutePath, { status: 404 });
      }

      // Convert path to file:// URL for net.fetch
      const fileUrl = 'file://' + absolutePath;
      return net.fetch(fileUrl);
    } catch (err) {
      return new Response('Error serving local asset: ' + err.message, { status: 500 });
    }
  });

  createWindow();

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

// IPC Handler implementations
ipcMain.handle('select-directory', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  if (result.canceled) return null;
  return result.filePaths[0];
});

ipcMain.handle('get-settings', () => {
  loadSettings();
  return settings;
});

ipcMain.handle('save-settings', (event, newSettings) => {
  return saveSettings(newSettings);
});

ipcMain.handle('get-asset-status', () => {
  const status = {
    cliInstalled: fs.existsSync(settings.cliPath),
    dataFolderExists: fs.existsSync(settings.paths.data),
    audioFolderExists: fs.existsSync(settings.paths.audio),
    assetsFolderExists: fs.existsSync(settings.paths.assets),
    cliPathUsed: settings.cliPath
  };
  return status;
});

// Helper function to recursively copy files
function copyDirRecursive(src, dest) {
  fs.cpSync(src, dest, { recursive: true, force: true });
}

ipcMain.handle('import-local-assets', async (event, srcDir, assetTypes) => {
  try {
    if (!fs.existsSync(srcDir)) {
      return { success: false, error: 'Source directory does not exist.' };
    }

    let copiedCount = 0;
    // Map of target subfolders
    if (assetTypes.scripts) {
      const srcMovies = path.join(srcDir, 'client/movie');
      if (fs.existsSync(srcMovies)) {
        copyDirRecursive(srcMovies, settings.paths.data);
        copiedCount++;
      } else if (fs.existsSync(path.join(srcDir, 'movies'))) {
        copyDirRecursive(path.join(srcDir, 'movies'), path.join(settings.paths.data, 'movies'));
        copiedCount++;
      } else {
        // Assume direct copy of scripts
        copyDirRecursive(srcDir, settings.paths.data);
        copiedCount++;
      }
    }

    if (assetTypes.audio) {
      const srcAudio = path.join(srcDir, 'audio');
      if (fs.existsSync(srcAudio)) {
        copyDirRecursive(srcAudio, settings.paths.audio);
        copiedCount++;
      } else {
        copyDirRecursive(srcDir, settings.paths.audio);
        copiedCount++;
      }
    }

    if (assetTypes.images) {
      const srcAssets = path.join(srcDir, 'assets');
      if (fs.existsSync(srcAssets)) {
        copyDirRecursive(srcAssets, settings.paths.assets);
        copiedCount++;
      } else {
        copyDirRecursive(srcDir, settings.paths.assets);
        copiedCount++;
      }
    }

    if (copiedCount === 0) {
      return { success: false, error: 'No matching asset directories found in source folder. Make sure it contains movies, audio, or assets folders.' };
    }

    return { success: true, message: 'Assets imported successfully!' };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

let currentCliProcess = null;

ipcMain.handle('pull-cloud-assets', async (event, preset, assetTypes) => {
  if (currentCliProcess) {
    return { success: false, error: 'An update process is already running.' };
  }

  return new Promise((resolve) => {
    try {
      const tempOutDir = path.join(app.getPath('temp'), 'pgr-assets-download-' + Date.now());
      fs.mkdirSync(tempOutDir, { recursive: true });

      const args = ['extract', '--preset', preset, '--output', tempOutDir];
      
      if (assetTypes.scripts) args.push('--all-temp');
      if (assetTypes.audio) args.push('--all-audio');
      if (assetTypes.images) args.push('--all-images');
      if (assetTypes.video) args.push('--all-video');

      // Use sha1cache to speed up incremental runs
      const cachePath = path.join(app.getPath('userData'), 'pgr_sha1cache.json');
      args.push('--cache', cachePath);

      mainWindow.webContents.send('log-update', `Starting download CLI command: pgr-assets ${args.join(' ')}\n`);

      currentCliProcess = spawn(settings.cliPath, args, {
        env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
      });

      currentCliProcess.stdout.on('data', (data) => {
        mainWindow.webContents.send('log-update', data.toString());
      });

      currentCliProcess.stderr.on('data', (data) => {
        mainWindow.webContents.send('log-update', `[Warning] ${data.toString()}`);
      });

      currentCliProcess.on('close', (code) => {
        currentCliProcess = null;
        if (code !== 0) {
          mainWindow.webContents.send('log-update', `\n[Error] Process exited with code ${code}.\n`);
          resolve({ success: false, error: `CLI process failed with exit code ${code}` });
          return;
        }

        mainWindow.webContents.send('log-update', `\nExtraction complete. Copying assets to destination folders...\n`);
        
        try {
          // Copy scripts
          if (assetTypes.scripts) {
            const tempMovies = path.join(tempOutDir, 'temp/bytes/client/movie');
            if (fs.existsSync(tempMovies)) {
              copyDirRecursive(tempMovies, settings.paths.data);
              mainWindow.webContents.send('log-update', `Copied Scripts to: ${settings.paths.data}\n`);
            } else {
              mainWindow.webContents.send('log-update', `[Warning] Could not find extracted movies subfolder in temp.\n`);
            }
          }

          // Copy audio
          if (assetTypes.audio) {
            const tempAudio = path.join(tempOutDir, 'audio');
            if (fs.existsSync(tempAudio)) {
              copyDirRecursive(tempAudio, settings.paths.audio);
              mainWindow.webContents.send('log-update', `Copied Audio to: ${settings.paths.audio}\n`);
            }
          }

          // Copy images
          if (assetTypes.images) {
            const tempAssets = path.join(tempOutDir, 'assets');
            if (fs.existsSync(tempAssets)) {
              copyDirRecursive(tempAssets, settings.paths.assets);
              mainWindow.webContents.send('log-update', `Copied Graphics to: ${settings.paths.assets}\n`);
            }
          }

          // Cleanup temp
          fs.rmSync(tempOutDir, { recursive: true, force: true });
          mainWindow.webContents.send('log-update', `\nCloud update finished successfully!\n`);
          resolve({ success: true });
        } catch (copyErr) {
          mainWindow.webContents.send('log-update', `\n[Error] Copying files failed: ${copyErr.message}\n`);
          resolve({ success: false, error: copyErr.message });
        }
      });

    } catch (err) {
      currentCliProcess = null;
      resolve({ success: false, error: err.message });
    }
  });
});

ipcMain.handle('cancel-pull', () => {
  if (currentCliProcess) {
    currentCliProcess.kill();
    currentCliProcess = null;
    mainWindow.webContents.send('log-update', `\n[Cancelled] Downloader process was terminated by user.\n`);
    return true;
  }
  return false;
});
