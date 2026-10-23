/**
 * Resolve hooks for proofs that import the real application modules:
 * `@/x` → apps/web/x, and extensionless relative/alias imports → .ts / .tsx /
 * index.ts, as the Next build resolves them. Proof tooling only; never shipped.
 */
import { existsSync, statSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { join, resolve as resolvePath } from 'node:path'

const WEB = resolvePath(fileURLToPath(new URL('.', import.meta.url)), '..', '..')

function candidate(path) {
  for (const p of [path, `${path}.ts`, `${path}.tsx`, join(path, 'index.ts')]) {
    if (existsSync(p) && statSync(p).isFile()) return p
  }
  return null
}

export async function resolve(specifier, context, next) {
  let base = null
  if (specifier.startsWith('@/')) base = join(WEB, specifier.slice(2))
  else if ((specifier.startsWith('./') || specifier.startsWith('../')) && context.parentURL?.startsWith('file:')) {
    base = resolvePath(fileURLToPath(new URL('.', context.parentURL)), specifier)
  }
  if (base) {
    const found = candidate(base)
    if (found) return { url: pathToFileURL(found).href, shortCircuit: true }
  }
  return next(specifier, context)
}
