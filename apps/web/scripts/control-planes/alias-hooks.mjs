/**
 * Resolve hooks for proofs that import the real application modules:
 * `@/x` → apps/web/x, and extensionless relative/alias imports → .ts / .tsx /
 * index.ts, as the Next build resolves them. Proof tooling only; never shipped.
 */
import { existsSync, readFileSync, statSync } from 'node:fs'
import { createRequire } from 'node:module'
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
  // `next/link` and friends are CommonJS files without an exports map; the bundler adds `.js`.
  if (/^next\/[a-z-]+$/.test(specifier)) return next(`${specifier}.js`, context)
  return next(specifier, context)
}

/** Node strips TypeScript types but not JSX: transpile .tsx components with the project's compiler. */
export async function load(url, context, next) {
  if (url.startsWith('file:') && url.endsWith('.tsx')) {
    const ts = createRequire(import.meta.url)('typescript')
    const source = ts.transpileModule(readFileSync(fileURLToPath(url), 'utf8'), {
      compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, verbatimModuleSyntax: false },
      fileName: fileURLToPath(url),
    }).outputText
    return { format: 'module', source, shortCircuit: true }
  }
  return next(url, context)
}
