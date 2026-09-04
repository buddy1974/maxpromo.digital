/**
 * packages/tooling/strip-comments.mjs
 *
 * Comment removal, string-aware, line numbers preserved.
 *
 * This replaced a line-by-line block-comment tracker, and the reason is worth
 * recording. That tracker looked for a block-comment opener and closer on each
 * line, set an `inBlock` flag, and only checked for a line comment afterwards.
 * So a line comment containing a path glob — a `messages/` prefix followed by a
 * star and `.json` — read as a block-comment opener that never closed, and
 * every remaining line in the file went unscanned. The audit reported "clean"
 * while checking roughly half of one of the largest components on the homepage,
 * which is exactly where a genuine accent-as-text failure was living.
 *
 * A checker that can be switched off by a comment is worse than no checker,
 * because it reports success. This walks characters instead, tracking string
 * and template-literal state, so that an opener inside a string or a `//`
 * inside a URL cannot change the comment state.
 *
 * Comment spans are blanked rather than deleted, so a finding's line number
 * still points at the real source.
 */

const BACKSLASH = String.fromCharCode(92)

export function stripComments(source) {
  const out = source.split('')
  const n = source.length
  let i = 0
  let state = 'code' // code | single | double | template
  let templateDepth = 0

  const blank = (from, to) => {
    for (let k = from; k < to; k++) if (out[k] !== '\n') out[k] = ' '
  }

  while (i < n) {
    const c = source[i]
    const d = source[i + 1]

    if (state === 'code') {
      if (c === '/' && d === '/') {
        const s = i
        while (i < n && source[i] !== '\n') i++
        blank(s, i)
        continue
      }
      if (c === '/' && d === '*') {
        const s = i
        i += 2
        while (i < n && !(source[i] === '*' && source[i + 1] === '/')) i++
        i = Math.min(i + 2, n)
        blank(s, i)
        continue
      }
      if (c === "'") { state = 'single'; i++; continue }
      if (c === '"') { state = 'double'; i++; continue }
      if (c === '`') { state = 'template'; templateDepth = 0; i++; continue }
      i++
      continue
    }

    // Inside a string of some kind. An escape consumes the next character.
    if (c === BACKSLASH) { i += 2; continue }

    if (state === 'single' || state === 'double') {
      if ((state === 'single' && c === "'") || (state === 'double' && c === '"')) {
        state = 'code'
      } else if (c === '\n') {
        // An unterminated quote is a syntax error upstream. Recover rather
        // than letting one bad line swallow the rest of the file — the whole
        // point of this rewrite.
        state = 'code'
      }
      i++
      continue
    }

    // Template literal. `${ ... }` returns to code and may contain strings.
    if (c === '$' && d === '{') { templateDepth++; i += 2; continue }
    if (c === '}' && templateDepth > 0) { templateDepth--; i++; continue }
    if (c === '`' && templateDepth === 0) { state = 'code'; i++; continue }
    i++
  }

  return out.join('')
}
