// vite.config.mjs
import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

export default defineConfig({
    plugins: [preact()],
    build: { outDir: 'dist' },

    // Optional: so libraries that expect React still work
    resolve: {
        alias: {
            react: 'preact/compat',
            'react-dom': 'preact/compat'
        }
    }
});
