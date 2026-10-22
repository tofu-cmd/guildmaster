import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// One self-contained HTML file, used for previews and quick sharing.
export default defineConfig({ plugins: [react(), viteSingleFile()], build: { outDir: 'dist-single' } });
