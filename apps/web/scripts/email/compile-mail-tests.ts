/** Transpile isolated proof modules; the normal workspace typecheck validates types. */
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, resolve, sep } from 'node:path'
import { tmpdir } from 'node:os'
import ts from 'typescript'
const target=resolve(process.argv[2]??'')
if(!target.startsWith(resolve(tmpdir())+sep) || !target.includes('maxpromo-mail-proof-')) throw new Error('Unsafe proof output')
mkdirSync(join(target,'mail'),{recursive:true})
for(const name of readdirSync('apps/web/lib/mail').filter(name=>name.endsWith('.ts'))){
  const source=readFileSync(join('apps/web/lib/mail',name),'utf8')
  const compiled=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText
  writeFileSync(join(target,'mail',name.replace(/\.ts$/,'.js')),compiled)
}
