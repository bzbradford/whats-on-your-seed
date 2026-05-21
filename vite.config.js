import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ command }) => ({
	plugins: [tailwindcss(), svelte()],
	base: command === 'build' ? '/whats-on-your-seed/' : '/'
}));
