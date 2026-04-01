import { defineConfig } from 'vite';

export default defineConfig({
    clearScreen: false,
    server: { 
        port: 5180, 
        strictPort: true 
    },
    envPrefix: ['VITE_', 'TAURI_'],
    build: {
        // Tauri 2 alvos recomendados
        target: ['es2021', 'chrome105', 'safari13'],
        minify: !process.env.TAURI_DEBUG ? 'esbuild' : false,
        sourcemap: !!process.env.TAURI_DEBUG,
    },
});