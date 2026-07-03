import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://chetra.xyz',
  // Cloudflare Pages serves this as a directory-output static site, which
  // 308-redirects `/work` -> `/work/`. Forcing 'always' here makes the dev
  // server enforce the exact same trailing-slash requirement, so a wrong
  // internal href fails loudly locally instead of only surfacing as an
  // extra redirect hop in production.
  trailingSlash: 'always',
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
