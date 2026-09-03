import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/**
 * Flat config, mirroring maxpromo.digital's.
 *
 * Replaces .eslintrc.json: ESLint 9 no longer reads the legacy format, and
 * Next 16 removed `next lint`, so the previous setup silently linted nothing.
 */
const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "lib/db/migrations/**",
    "lib/seed/**",
    "scripts/**",
  ]),
]);

export default eslintConfig;
