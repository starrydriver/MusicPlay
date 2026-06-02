import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	server: {
		port: 4431
	},
	preview: {
		port: 4431
	},
	vite: {
		optimizeDeps: {
		  include: ['pixi.js']
		}
	  }
});