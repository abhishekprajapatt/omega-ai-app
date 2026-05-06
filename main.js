const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, 'assets/icon.ico'),
  });

  Menu.setApplicationMenu(null);
  win.loadURL("https://omg-ai.vercel.app");
  
}

app.whenReady().then(createWindow);