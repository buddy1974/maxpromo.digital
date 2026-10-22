/** Keep the command shared; SQL proof dependencies belong to the web workspace. */
import { execFileSync } from 'node:child_process'
execFileSync(process.execPath,['--disable-warning=MODULE_TYPELESS_PACKAGE_JSON','apps/web/scripts/email/prove-email-storage.ts'],{stdio:'inherit'})
