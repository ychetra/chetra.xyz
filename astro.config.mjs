import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://chetra.xyz',
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()],
    server: {
      // temp: allow dev-server access through preview tunnels
      allowedHosts: ['.lhr.life', '.chetra.xyz'],
    },
    preview: {
      allowedHosts: true,
    },
  },
});
