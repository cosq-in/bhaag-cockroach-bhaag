// Adds the build id to asset URLs so a new deploy is never served from a stale browser or CDN cache.
export const asset = (url) => `${url}?v=${globalThis.BUILD ?? 'dev'}`;
