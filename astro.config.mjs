import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  output: 'server',
  adapter: cloudflare(),
  site: 'https://gaschampion.co.uk',
  integrations: [
    react(),
    sitemap(),
  ],
  vite: {
    css: {
      postcss: './postcss.config.cjs',
    },
  },
});
