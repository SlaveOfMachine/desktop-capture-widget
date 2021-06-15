const { app, BrowserWindow } = require('electron');
const path = require('path');
const { ipcMain } = require('electron');

function createWindow () {
  const win = new BrowserWindow({
    width: 160,
    height: 50,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: false,
      nodeIntegration: true,
      enableRemoteModule: true,
    },
    frame: false,
    transparent: true,
  });
  win.setMaximizable(false);
  win.setAlwaysOnTop(true);
  win.removeMenu();
  win.webContents.openDevTools();
  win.loadFile('index.html');
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => { closeAllWindows() })

ipcMain.on('window-all-closed', () => { closeAllWindows() });

function closeAllWindows() {
  if (process.platform !== 'darwin') {
    app.quit()
  }
}

try {
    require('electron-reloader')(module, {
        debug: true,
        watchRenderer: true
    });
} catch (_) { console.log('Error'); }    