import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import createNextIntlPlugin from 'next-intl/plugin';

/**
 * next-intl, pointed at i18n/request.ts.
 *
 * This application has no [locale] route segment — the Domain Registry says
 * `useLocalePrefix: false` for this host, and lib/i18n/locale.ts explains why a
 * signed-in product resolves its language from a cookie instead of from the
 * URL. The plugin is the same one apps/web uses; only the source of the locale
 * differs.
 */
const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  /**
   * Pin the build root.
   *
   * Without this, Next infers the workspace root by walking up looking for a
   * lockfile, finds one in a parent directory outside the repository, and warns
   * on every build. An inferred root is not just noise: it decides which files
   * are traced into the deployment output, so a wrong guess can silently
   * include or exclude the wrong tree. Both applications state it.
   */
  turbopack: { root: join(fileURLToPath(new URL('.', import.meta.url)), '..', '..') },

  reactStrictMode: true,
  poweredByHeader: false,
};

export default withNextIntl(nextConfig);
