const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const http = require('http');
const net = require('net');

let mainWindow;

// Disable default menu for a clean, professional application look
Menu.setApplicationMenu(null);

function findFreePort(startPort, callback) {
  const server = net.createServer();
  server.unref();
  server.on('error', () => {
    findFreePort(startPort + 1, callback);
  });
  server.listen(startPort, () => {
    server.close(() => {
      callback(startPort);
    });
  });
}

function checkServerReady(url, callback) {
  const req = http.get(url, (res) => {
    if (res.statusCode === 200) {
      callback(true);
    } else {
      setTimeout(() => checkServerReady(url, callback), 100);
    }
  });
  req.on('error', () => {
    setTimeout(() => checkServerReady(url, callback), 100);
  });
}

function createWindow(port) {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 850,
    title: 'TradeJrnl',
    icon: path.join(__dirname, 'assets/icon.png'),
    show: false, // Prevents white flash before load
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      devTools: !app.isPackaged,
    }
  });

  const url = `http://localhost:${port}`;

  if (app.isPackaged) {
    // Wait until the local Express server is ready, then load
    checkServerReady(url, () => {
      mainWindow.loadURL(url);
    });
  } else {
    // In development, load directly
    mainWindow.loadURL(url);
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Single instance lock to prevent launching multiple app windows
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    findFreePort(3000, (port) => {
      // In production/packaged mode, launch the server
      if (app.isPackaged) {
        process.env.NODE_ENV = 'production';
        process.env.PORT = port.toString();
        try {
          // Require the compiled Express server bundle
          require(path.join(__dirname, '../dist/server.cjs'));
          console.log(`Server launched on port ${port}`);
        } catch (err) {
          console.error('Failed to require server.cjs:', err);
        }
      } else {
        // In dev, use the existing running port (3000)
        port = 3000;
      }

      createWindow(port);
    });
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    findFreePort(3000, (port) => {
      createWindow(port);
    });
  }
});
