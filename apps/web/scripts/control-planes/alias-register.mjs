/** `node --import ./alias-register.mjs` — installs alias-hooks.mjs for a proof run. */
import { register } from 'node:module'
register(new URL('./alias-hooks.mjs', import.meta.url))
