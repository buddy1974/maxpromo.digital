/** Offline mail suite: never loads environment files or reaches a transport. */
import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync, realpathSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve, sep } from 'node:path'

const output = mkdtempSync(join(tmpdir(), 'maxpromo-mail-proof-'))
try {
  execFileSync(process.execPath, ['node_modules/typescript/bin/tsc',
    'apps/web/lib/mail/provider.ts', 'apps/web/lib/mail/provider.test.ts',
    'apps/web/lib/mail/normalization.ts', 'apps/web/lib/mail/channel.test.ts',
    '--target','ES2022','--module','commonjs','--moduleResolution','node','--esModuleInterop','--skipLibCheck','--outDir',output], { stdio: 'inherit' })
  execFileSync(process.execPath, ['--test',join(output,'provider.test.js'),join(output,'channel.test.js')], { stdio: 'inherit' })
  for (const file of ['prove-email-owner.ts','prove-email-ui.ts','prove-email-webhook.ts','prove-email-actions.ts','prove-email-engine.ts','prove-email-notices.ts','prove-email-inbox-api.ts','prove-email-mutations.ts']) {
    execFileSync(process.execPath, ['--disable-warning=MODULE_TYPELESS_PACKAGE_JSON',join('apps/web/scripts/email',file)], { stdio: 'inherit' })
  }
} finally {
  const absolute = realpathSync(output)
  if (!absolute.startsWith(resolve(tmpdir()) + sep) || !absolute.includes('maxpromo-mail-proof-')) throw new Error('Unsafe temporary path')
  rmSync(absolute, { recursive: true, force: true })
}
