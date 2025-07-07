const { app, BrowserWindow } = require('electron');
const { spawn } = require('child_process');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      contextIsolation: true,
    },
  });

  // Wait a few seconds and load the React app
  setTimeout(() => {
    mainWindow.loadURL('http://localhost:3000');
  }, 8000); // Give the server and React some time
}

app.whenReady().then(() => {
  const cwd = path.join(__dirname);

  // 1️⃣ Start server.js
  const serverProcess = spawn('node', ['server.js'], {
    cwd,
    shell: true,
  });

  serverProcess.stdout.on('data', data => console.log(`[Server]: ${data}`));
  serverProcess.stderr.on('data', data => console.error(`[Server Error]: ${data}`));

  // 2️⃣ Start React app
  const reactProcess = spawn('npm', ['start'], {
    cwd,
    shell: true,
  });

  reactProcess.stdout.on('data', data => console.log(`[React]: ${data}`));
  reactProcess.stderr.on('data', data => console.error(`[React Error]: ${data}`));

  // 3️⃣ Launch window
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
