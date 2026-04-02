const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const { existsSync } = require('fs');
const http = require('http');

let engineProcess = null;
let mainWindow = null;
let healthCheckInterval = null;
let restartAttempts = 0;
const MAX_RESTART_ATTEMPTS = 5;

function getEnginePath() {
  const isDev = !app.isPackaged;
  if (isDev) {
    return null;
  } else {
    return path.join(process.resourcesPath, 'engine', 'engine.exe');
  }
}

function startEngine() {
  const isDev = !app.isPackaged;
  const engineDir = isDev
    ? path.resolve(__dirname, '..', '..', 'engine')
    : path.join(process.resourcesPath, 'engine');

  const engineScript = path.join(engineDir, 'main.py');

  if (!existsSync(engineScript)) {
    console.error('[Engine] main.py not found at:', engineScript);
    return;
  }

  const pythonCandidates = [
    path.join(engineDir, '.venv', 'Scripts', 'python.exe'),
    path.join(__dirname, '..', '..', 'engine', '.venv', 'Scripts', 'python.exe'),
    'python',
  ];

  const pythonExe = pythonCandidates.find(p => {
    try { return existsSync(p); } catch { return false; }
  }) || 'python';

  console.log('[Engine] Using Python:', pythonExe);
  console.log('[Engine] Script:', engineScript);
  console.log('[Engine] CWD:', engineDir);

  engineProcess = spawn(pythonExe, [engineScript], {
    cwd: engineDir,
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe']
  });

  engineProcess.stdout.on('data', (data) => {
    console.log(`[Engine] ${data.toString().trim()}`);
  });

  engineProcess.stderr.on('data', (data) => {
    const msg = data.toString().trim();
    console.log(`[Engine] ${msg}`);
  });

  engineProcess.on('close', (code) => {
    console.log(`[Engine] Process exited with code ${code}`);
    engineProcess = null;

    // Auto-restart on unexpected crash
    if (code !== 0 && restartAttempts < MAX_RESTART_ATTEMPTS && mainWindow && !app.isQuitting) {
      restartAttempts++;
      const delay = Math.min(restartAttempts * 2000, 10000);
      console.log(`[Engine] Auto-restarting in ${delay}ms (attempt ${restartAttempts}/${MAX_RESTART_ATTEMPTS})`);
      setTimeout(() => {
        if (mainWindow && !app.isQuitting) {
          startEngine();
        }
      }, delay);
    }
  });

  engineProcess.on('error', (err) => {
    console.error('[Engine] Spawn error:', err.message);
    if (mainWindow) mainWindow.webContents.send('engine-error', err.message);
  });

  // Start health check
  startHealthCheck();
}

function startHealthCheck() {
  if (healthCheckInterval) clearInterval(healthCheckInterval);

  healthCheckInterval = setInterval(() => {
    if (!engineProcess || app.isQuitting) {
      if (healthCheckInterval) clearInterval(healthCheckInterval);
      return;
    }

    const req = http.get('http://127.0.0.1:8181/health', (res) => {
      if (res.statusCode === 200) {
        restartAttempts = 0; // Reset on healthy response
      }
      res.resume();
    });

    req.on('error', () => {
      // Engine not responding yet — normal during startup
    });

    req.setTimeout(3000, () => {
      req.destroy();
    });
  }, 10000);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 900,
    minHeight: 600,
    frame: false,
    backgroundColor: '#050505',
    icon: path.join(__dirname, '..', 'src', 'assets', 'icon.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
    },
  });

  const isDev = !app.isPackaged;

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  // Window controls via IPC
  ipcMain.on('window-minimize', () => mainWindow?.minimize());
  ipcMain.on('window-maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow?.maximize();
    }
  });
  ipcMain.on('window-close', () => mainWindow?.close());

  // File open dialog via IPC
  ipcMain.handle('open-file-dialog', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: [
        { name: 'Audio/Video Files', extensions: ['mp3', 'wav', 'm4a', 'flac', 'ogg', 'mp4', 'mkv', 'mov', 'avi', 'webm'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });
    if (!result.canceled && result.filePaths.length > 0) {
      return result.filePaths[0];
    }
    return null;
  });

  // Folder open dialog for output directory
  ipcMain.handle('open-folder-dialog', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory', 'createDirectory'],
    });
    if (!result.canceled && result.filePaths.length > 0) {
      return result.filePaths[0];
    }
    return null;
  });
}

app.whenReady().then(() => {
  startEngine();
  setTimeout(createWindow, 1000);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  app.isQuitting = true;
});

app.on('will-quit', () => {
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
  }
  if (engineProcess && !engineProcess.killed) {
    engineProcess.kill('SIGTERM');
    engineProcess = null;
  }
});
