import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vite.dev/config/
export default defineConfig({
	plugins: [
		react(),
		visualizer({
			open: true,
			gzipSize: true,
			brotliSize: true,
			filename: 'dist/stats.html'
		})
	],
	build: {
		rollupOptions: {
			output: {
				manualChunks: {
					// Separar React y React DOM
					vendor: ['react', 'react-dom'],
					// Separar librerías de UI
					ui: ['lucide-react', 'react-toastify']
				}
			}
		},
		// Optimizaciones adicionales
		minify: 'terser',
		sourcemap: false,
		chunkSizeWarningLimit: 1000,
		// Optimizar CSS
		cssCodeSplit: true,
		// Optimizar assets
		assetsInlineLimit: 4096
	},
	// Optimizaciones de desarrollo
	optimizeDeps: {
		include: ['react', 'react-dom', 'lucide-react']
	}
})
