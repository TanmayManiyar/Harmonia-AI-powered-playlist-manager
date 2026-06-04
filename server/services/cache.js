// Tiny in-memory TTL cache. Single-instance only — for a multi-instance
// deploy, swap this for Redis. Used to avoid repeat YouTube/Gemini calls.

const store = new Map();
let lastSweep = 0;

function sweep() {
  const now = Date.now();
  if (now - lastSweep < 60_000) return; // sweep at most once/min
  lastSweep = now;
  for (const [k, e] of store) {
    if (e.exp < now) store.delete(k);
  }
}

export function cacheGet(key) {
  const e = store.get(key);
  if (!e) return undefined;
  if (e.exp < Date.now()) {
    store.delete(key);
    return undefined;
  }
  return e.val;
}

export function cacheSet(key, val, ttlMs) {
  sweep();
  store.set(key, { val, exp: Date.now() + ttlMs });
}

/** Get-or-compute with caching. `fn` is only called on a miss. */
export async function cached(key, ttlMs, fn) {
  const hit = cacheGet(key);
  if (hit !== undefined) return hit;
  const val = await fn();
  cacheSet(key, val, ttlMs);
  return val;
}
