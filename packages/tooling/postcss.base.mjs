/**
 * packages/tooling/postcss.base.mjs
 *
 * One PostCSS configuration.
 *
 * Both applications carried their own copy of the same single-plugin object,
 * and the two copies had already drifted apart typographically — different
 * quote style, one with a type annotation and one without. Nothing was broken
 * by that and nothing ever would have been; it is here because build
 * configuration duplicated in two places is the shape every other duplication
 * in this repository started as.
 */

/** @type {import('postcss-load-config').Config} */
export const maxpromoPostcssBase = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}

export default maxpromoPostcssBase
