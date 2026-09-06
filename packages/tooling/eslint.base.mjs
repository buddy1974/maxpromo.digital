import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

/**
 * Shared ESLint configuration for every Maxpromo application.
 *
 * Applications import this and append only their own ignores. Before this
 * existed, one repository had a flat config and the other still had a legacy
 * .eslintrc.json that ESLint 9 could not read — so its lint was silently
 * passing without checking anything.
 */
export const maxpromoEslintBase = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
  ]),
])

export default maxpromoEslintBase
