import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config';

export default defineWorkersConfig({
  test: {
    clearMocks: true,
    poolOptions: {
      workers: {
        wrangler: { configPath: './wrangler.toml' },
        miniflare: {
          bindings: {
            BUILD_API_KEY: 'test-key',
            ADMIN_CHAT_ID: 'test-admin',
            TELEGRAM_BOT_TOKEN: 'test-token',
            TELEGRAM_WEBHOOK_SECRET: 'test-secret',
            FACEBOOK_APP_ID: 'test-app-id',
            FACEBOOK_APP_SECRET: 'test-app-secret',
            GOOGLE_PLACES_API_KEY: 'test-google-key',
          },
        },
      },
    },
  },
});
