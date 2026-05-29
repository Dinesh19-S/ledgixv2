import { app, BrowserWindow, protocol } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    title: "Ledgix - Leader Management System",
    icon: path.join(__dirname, '../public/logo.png'),
    show: false, // Don't show until content is ready
    backgroundColor: '#f8fafc', // Match app background to prevent black flash
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      // Allow loading local files in production
      webSecurity: true,
    },
  });

  // Hide menu bar
  win.setMenuBarVisibility(false);

  // Show window only when content is ready to prevent black screen
  win.once('ready-to-show', () => {
    win.show();
  });

  // Fallback: show window after timeout if ready-to-show doesn't fire
  setTimeout(() => {
    if (!win.isVisible()) {
      win.show();
    }
  }, 5000);

  const isDev = process.env.IS_DEV === 'true';

  if (isDev) {
    win.loadURL('http://localhost:5173');
    win.webContents.openDevTools();
  } else {
    // Production: load the built index.html from dist folder
    const indexPath = path.join(__dirname, '../dist/index.html');
    console.log('[Ledgix] Loading production file:', indexPath);

    win.loadFile(indexPath).catch((err) => {
      console.error('[Ledgix] Failed to load index.html:', err);
      // Show an error page if the file can't be loaded
      win.loadURL(`data:text/html,
        <html>
          <body style="font-family: system-ui; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f8fafc; color: #0f172a;">
            <div style="text-align: center;">
              <h1>Failed to load application</h1>
              <p style="color: #64748b;">${err.message}</p>
              <p style="color: #64748b; font-size: 12px;">Path: ${indexPath}</p>
            </div>
          </body>
        </html>
      `);
    });
  }

  // Log any renderer process errors
  win.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error('[Ledgix] Page failed to load:', errorCode, errorDescription, validatedURL);
  });

  // Log console messages from renderer
  win.webContents.on('console-message', (event, level, message, line, sourceId) => {
    if (level >= 2) { // warnings and errors
      console.log(`[Renderer ${level === 2 ? 'WARN' : 'ERROR'}] ${message}`);
    }
  });

  // Handle downloads to show a save dialog
  win.webContents.session.on('will-download', (event, item, webContents) => {
    item.setSaveDialogOptions({
      title: 'Save File',
      defaultPath: path.join(app.getPath('downloads'), item.getFilename()),
    });
  });
}

app.whenReady().then(() => {
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
