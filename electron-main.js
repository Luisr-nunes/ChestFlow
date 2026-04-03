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
        icon: path.join(__dirname, 'src-tauri/icons/icon.ico'),
        webPreferences: {
            preload: path.join(__dirname, 'electron-preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    // Remove a barra de menu padrão (File, Edit, etc) para visual limpo
    mainWindow.setMenuBarVisibility(false);

    // Em desenvolvimento, carrega do servidor do Vite
    // Em produção, carrega o arquivo index.html da pasta dist
    const isDev = process.env.NODE_ENV === 'development';
    if (isDev) {
        mainWindow.loadURL('http://localhost:5180');
        // mainWindow.webContents.openDevTools(); // Desativado após diagnóstico
    } else {
        mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
    }
}

function startRustBackend() {
    const isDev = process.env.NODE_ENV === 'development';
    let backendPath;

    if (isDev) {
        const debugBinary = path.join(__dirname, 'src-tauri/target/debug/chestflow-backend.exe');
        const fs = require('fs');
        
        if (fs.existsSync(debugBinary)) {
            console.log("Iniciando backend via binário compilado (Otimizado)");
            backendPath = debugBinary;
            rustProcess = spawn(backendPath, [], { shell: true }); // Adicionado shell: true
        } else {
            console.log("Iniciando backend via cargo run (Lento - Rode 'cargo build' em src-tauri para otimizar)");
            backendPath = 'cargo';
            rustProcess = spawn(backendPath, ['run', '--manifest-path', 'src-tauri/Cargo.toml'], {
                shell: true
            });
        }
    } else {
        // No build, usamos o executável compilado que estará em resources/backend.exe
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
        app.quit();
    }
});
