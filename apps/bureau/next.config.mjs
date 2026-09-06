import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

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

export default nextConfig;
