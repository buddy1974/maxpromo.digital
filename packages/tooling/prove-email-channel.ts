/** Offline mail suite: never loads environment files or reaches a transport. */
import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync, realpathSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve, sep } from 'node:path'

const output = mkdtempSync(join(tmpdir(), 'maxpromo-mail-proof-'))
try {
  execFileSync(process.execPath, ['apps/web/scripts/email/compile-mail-tests.ts',output], { stdio: 'inherit' })
  execFileSync(process.execPath, ['--test',...['provider','channel','hostingerWebhook','content','contentWorker','contentStore','hostingerIngestion','risk','providerState'].map(file=>join(output,`mail/${file}.test.js`))], { stdio: 'inherit' })
  for (const file of ['prove-email-owner.ts','prove-hostinger-webhook.ts','prove-email-actions.ts','prove-email-engine.ts','prove-email-notices.ts','prove-email-inbox-api.ts','prove-email-mutations.ts','prove-release-guards.ts']) {
    execFileSync(process.execPath, ['--disable-warning=MODULE_TYPELESS_PACKAGE_JSON',join('apps/web/scripts/email',file)], { stdio: 'inherit' })
  }
  // The Email OS workspace proofs import the real modules and components (ADR-0023).
  for (const file of ['prove-email-ui.ts','prove-email-outbound.ts','prove-owner-notices.ts']) {
    execFileSync(process.execPath, ['--disable-warning=MODULE_TYPELESS_PACKAGE_JSON','--disable-warning=ExperimentalWarning','--experimental-transform-types',
      '--import','./apps/web/scripts/control-planes/alias-register.mjs',join('apps/web/scripts/email',file)], { stdio: 'inherit' })
  }
} finally {
  const absolute = realpathSync(output)
  if (!absolute.startsWith(resolve(tmpdir()) + sep) || !absolute.includes('maxpromo-mail-proof-')) throw new Error('Unsafe temporary path')
  rmSync(absolute, { recursive: true, force: true })
}
