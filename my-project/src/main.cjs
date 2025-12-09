const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs'); // Added to check if files exist

// Keep global references
let mainWindow;
let apiServer;
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    title: "Wikaxd IDE",
    // ADD THIS LINE:
    icon: path.join(__dirname, '../public/logo.ico'), 
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    autoHideMenuBar: true,
  });

  const isDev = process.env.NODE_ENV === 'development';

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // Check if index.html exists before loading
    const indexPath = path.join(__dirname, '../dist/index.html');
    if (!fs.existsSync(indexPath)) {
      dialog.showErrorBox("Build Error", "Could not find index.html at:\n" + indexPath);
    }
    mainWindow.loadFile(indexPath);
  }
}

// --- BACKEND INTEGRATION (DEBUG VERSION) ---
function startExpressServer() {
  // const serverPath = path.join(__dirname, '../backend/server.js');
  const serverPath = path.join(__dirname, 'backend/server.js');
  
  // 1. CHECK IF FILE EXISTS
  if (!fs.existsSync(serverPath)) {
    dialog.showErrorBox("Missing File", 
      "The internal server.js file is missing!\n\n" +
      "I looked here:\n" + serverPath + "\n\n" +
      "Current Directory: " + __dirname
    );
    return;
  }

  console.log('🚀 Starting Backend Server from:', serverPath);

  // 2. SPAWN NODE
  apiServer = spawn('node', [serverPath], {
    cwd: path.join(__dirname, '..'), // Run from the 'app' root
    stdio: 'pipe', // Capture errors
    env: process.env 
  });

  // 3. LISTEN FOR CRASHES
  apiServer.stderr.on('data', (data) => {
    // Only show popup if it's a critical error, not just a warning
    const msg = data.toString();
    console.error(`Server Error: ${msg}`);
    // Optional: Uncomment below if you want popups for every server log
    // dialog.showErrorBox("Server Log", msg); 
  });

  apiServer.on('error', (err) => {
    dialog.showErrorBox("Launch Error", 
      "Failed to start Node.js process.\n\n" +
      "Error: " + err.message + "\n\n" +
      "Do you have Node.js installed on this computer?"
    );
  });
}

// --- APP LIFECYCLE ---

app.whenReady().then(() => {
  startExpressServer(); 
  createWindow();      

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (apiServer) {
      apiServer.kill(); 
    }
    app.quit();
  }
});