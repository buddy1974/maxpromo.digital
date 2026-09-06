import { defineConfig, globalIgnores } from 'eslint/config'
import { maxpromoEslintBase } from '../../packages/tooling/eslint.base.mjs'

export default defineConfig([
  ...maxpromoEslintBase,
  globalIgnores([
    'lib/db/migrations/**',
    'lib/seed/**',
  ]),
])
