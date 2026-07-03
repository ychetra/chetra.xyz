import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://chetra.xyz',
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'hover',
  },
  integrations: [
    sitemap({
      // /og-card/* are build-time render helpers for social share images,
      // not real pages — keep them out of the sitemap.
      filter: (page) => !page.includes('/og-card/'),
    }),
  ],
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
