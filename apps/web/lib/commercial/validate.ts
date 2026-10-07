/**
 * lib/commercial/validate.ts
 *
 * A small input validator for the agent API. Every capability declares the
 * shape it accepts; anything else is refused before a query is built.
 *
 * Deliberately minimal and dependency-free: the web application does not
 * depend on a schema library, and the agent API needs only strings, numbers,
 * dates, enums, ids, arrays and objects.
 */

export class InputError extends Error {
  constructor(public readonly field: string, message: string) {
    super(`${field}: ${message}`)
    this.name = 'InputError'
  }
}

export interface Validator<T> {
  parse(value: unknown, field: string): T
  readonly describe: string
}

type Infer<V> = V extends Validator<infer T> ? T : never

function make<T>(describe: string, parse: (value: unknown, field: string) => T): Validator<T> {
  return { describe, parse }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

export const v = {
  string(opts: { min?: number; max?: number } = {}) {
    const max = opts.max ?? 2000
    return make<string>(`string(≤${max})`, (x, f) => {
      if (typeof x !== 'string') throw new InputError(f, 'must be text')
      const s = x.trim()
      if (s.length < (opts.min ?? 1)) throw new InputError(f, 'must not be empty')
      if (s.length > max) throw new InputError(f, `must be at most ${max} characters`)
      return s
    })
  },
  number(opts: { min?: number; max?: number } = {}) {
    return make<number>('number', (x, f) => {
      const n = typeof x === 'string' && x.trim() !== '' ? Number(x) : x
      if (typeof n !== 'number' || !Number.isFinite(n)) throw new InputError(f, 'must be a number')
      if (opts.min !== undefined && n < opts.min) throw new InputError(f, `must be at least ${opts.min}`)
      if (opts.max !== undefined && n > opts.max) throw new InputError(f, `must be at most ${opts.max}`)
      return Math.round(n * 100) / 100
    })
  },
  integer(opts: { min?: number; max?: number } = {}) {
    return make<number>('integer', (x, f) => {
      const n = v.number(opts).parse(x, f)
      if (!Number.isInteger(n)) throw new InputError(f, 'must be a whole number')
      return n
    })
  },
  boolean() {
    return make<boolean>('boolean', (x, f) => {
      if (typeof x !== 'boolean') throw new InputError(f, 'must be true or false')
      return x
    })
  },
  uuid() {
    return make<string>('uuid', (x, f) => {
      if (typeof x !== 'string' || !UUID.test(x)) throw new InputError(f, 'must be a record id')
      return x.toLowerCase()
    })
  },
  date() {
    return make<string>('YYYY-MM-DD', (x, f) => {
      if (typeof x !== 'string' || !ISO_DATE.test(x)) throw new InputError(f, 'must be a date as YYYY-MM-DD')
      const d = new Date(`${x}T00:00:00Z`)
      if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== x) throw new InputError(f, 'is not a real date')
      return x
    })
  },
  email() {
    return make<string>('email', (x, f) => {
      const s = v.string({ max: 254 }).parse(x, f).toLowerCase()
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s)) throw new InputError(f, 'must be an email address')
      return s
    })
  },
  enumOf<const T extends readonly string[]>(values: T) {
    return make<T[number]>(values.join('|'), (x, f) => {
      if (typeof x !== 'string' || !values.includes(x)) throw new InputError(f, `must be one of ${values.join(', ')}`)
      return x as T[number]
    })
  },
  array<T>(item: Validator<T>, opts: { min?: number; max?: number } = {}) {
    const max = opts.max ?? 50
    return make<T[]>(`${item.describe}[]`, (x, f) => {
      if (!Array.isArray(x)) throw new InputError(f, 'must be a list')
      if (x.length < (opts.min ?? 0)) throw new InputError(f, `must have at least ${opts.min} entries`)
      if (x.length > max) throw new InputError(f, `must have at most ${max} entries`)
      return x.map((e, i) => item.parse(e, `${f}[${i}]`))
    })
  },
  optional<T>(inner: Validator<T>) {
    return make<T | undefined>(`${inner.describe}?`, (x, f) =>
      x === undefined || x === null || x === '' ? undefined : inner.parse(x, f))
  },
  object<S extends Record<string, Validator<unknown>>>(shape: S) {
    return make<{ [K in keyof S]: Infer<S[K]> }>(
      `{${Object.entries(shape).map(([k, s]) => `${k}: ${s.describe}`).join(', ')}}`,
      (x, f) => {
        if (typeof x !== 'object' || x === null || Array.isArray(x)) throw new InputError(f, 'must be an object')
        const input = x as Record<string, unknown>
        const unknownKeys = Object.keys(input).filter((k) => !(k in shape))
        if (unknownKeys.length) throw new InputError(f, `unexpected field ${unknownKeys[0]}`)
        const out: Record<string, unknown> = {}
        for (const [k, s] of Object.entries(shape)) {
          const parsed = s.parse(input[k], f ? `${f}.${k}` : k)
          if (parsed !== undefined) out[k] = parsed
        }
        return out as { [K in keyof S]: Infer<S[K]> }
      },
    )
  },
}

export type InferInput<V> = Infer<V>
