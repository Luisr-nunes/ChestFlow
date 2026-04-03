const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let rustProcess;

async function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        minWidth: 960,
        minHeight: 600,
        icon: path.join(__dirname, '..', 'assets', 'icons', 'icon.ico'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    mainWindow.setMenuBarVisibility(false);

    const isDev = process.env.NODE_ENV === 'development';
    if (isDev) {
        mainWindow.loadURL('http://localhost:5180');
    } else {
        mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
    }
}

function startRustBackend() {
    const isDev = process.env.NODE_ENV === 'development';
    let backendPath;

    if (isDev) {
        const debugBinary = path.join(__dirname, '..', 'backend', 'target', 'debug', 'chestflow-backend.exe');
        const fs = require('fs');

        if (fs.existsSync(debugBinary)) {
            console.log("Iniciando backend via binário compilado (Otimizado)");
            backendPath = debugBinary;
            rustProcess = spawn(backendPath, []);
        } else {
            console.log("Iniciando backend via cargo run (Lento - Rode 'cargo build' em backend/ para otimizar)");
            backendPath = 'cargo';
            rustProcess = spawn(backendPath, ['run', '--manifest-path', path.join(__dirname, '..', 'backend', 'Cargo.toml')], {
                shell: true
            });
        }
    } else {
        backendPath = path.join(process.resourcesPath, 'backend.exe');
        rustProcess = spawn(backendPath);
    }

    rustProcess.stdout.on('data', (data) => {
        console.log(`Backend: ${data}`);
    });

    rustProcess.stderr.on('data', (data) => {
        console.error(`Backend Error: ${data}`);
    });

    rustProcess.on('close', (code) => {
        console.log(`Backend process exited with code ${code}`);
    });
}

app.whenReady().then(() => {
    startRustBackend();
    createWindow();

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        if (rustProcess) rustProcess.kill();
        if (process.platform === 'win32') {
            require('child_process').exec('taskkill /f /im chestflow-backend.exe', () => {});
        }
        app.quit();
    }
});
