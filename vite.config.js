import { defineConfig } from 'vite';

export default defineConfig({
    base: './',
    clearScreen: false,
    server: {
        port: 5180,
        strictPort: true
    },
    build: {
        target: ['es2021', 'chrome105'],
        minify: 'esbuild',
        sourcemap: false,
    },
});