import type { State } from '../data/types';

/**
 * Pairing.
 *
 * Two devices in one family, and no server anywhere. That constraint decides the
 * whole design: a family cannot be *looked up* by its code, because there is
 * nothing to look it up in. So the family travels as a snapshot — a link the
 * first device makes and the parent sends themselves — and the code is what
 * turns that link into something usable.
 *
 * The code is not a label. The snapshot is encrypted with a key derived from it
 * (PBKDF2 → AES-GCM), so the link on its own is unreadable and the code on its
 * own carries nothing. A parent needs both, which is the same shape as any other
 * pairing flow they have used, and it means a join link sitting in a chat log is
 * not a copy of the family.
 *
 * Regenerating the code makes every earlier link permanently undecryptable.
 */

/* Ambiguous glyphs are gone: no O/0, I/1, S/5, B/8, Z/2. A code gets read aloud
   across a kitchen, so the alphabet has to survive being said out loud. */
const ALPHABET = 'ACDEFGHJKLMNPQRTUVWXY34679';

const DEVICE_KEY = 'sprout.device.v1';
const PREFIX = 'S2.';
const PBKDF2_ROUNDS = 120_000;

export function makeCode(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  const chars = [...bytes].map((b) => ALPHABET[b % ALPHABET.length]);
  return `${chars.slice(0, 4).join('')}-${chars.slice(4).join('')}`;
}

/** Uppercases, drops anything not in the alphabet, and re-hyphenates. */
export function normalizeCode(input: string): string {
  const clean = [...input.toUpperCase()].filter((c) => ALPHABET.includes(c)).join('').slice(0, 8);
  return clean.length > 4 ? `${clean.slice(0, 4)}-${clean.slice(4)}` : clean;
}

export function isCompleteCode(input: string): boolean {
  return normalizeCode(input).replace('-', '').length === 8;
}

/* --- Bytes ---------------------------------------------------------------- */

function toB64Url(bytes: Uint8Array): string {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromB64Url(text: string): Uint8Array {
  const t = text.replace(/-/g, '+').replace(/_/g, '/');
  const padded = t + '='.repeat((4 - (t.length % 4)) % 4);
  const bin = atob(padded);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i) & 0xff;
  return out;
}

async function through(bytes: Uint8Array, transform: 'gzip' | 'gunzip'): Promise<Uint8Array> {
  const stream =
    transform === 'gzip'
      ? new CompressionStream('gzip')
      : new DecompressionStream('gzip');
  const blob = new Blob([bytes as BlobPart]);
  const buf = await new Response(blob.stream().pipeThrough(stream)).arrayBuffer();
  return new Uint8Array(buf);
}

const canZip = typeof CompressionStream !== 'undefined';

/* --- Key ------------------------------------------------------------------ */

async function keyFrom(code: string, salt: Uint8Array): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(normalizeCode(code)),
    'PBKDF2',
    false,
    ['deriveKey'],
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations: PBKDF2_ROUNDS, hash: 'SHA-256' },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

/* --- Snapshot ------------------------------------------------------------- */

/** The family, compressed, encrypted under the code, as one URL-safe string. */
export async function encodeSnapshot(state: State, code: string): Promise<string> {
  const json = new TextEncoder().encode(JSON.stringify(state));
  const body = canZip ? await through(json, 'gzip') : json;
  const packed = new Uint8Array(body.length + 1);
  packed[0] = canZip ? 1 : 0;
  packed.set(body, 1);

  const salt = new Uint8Array(16);
  const iv = new Uint8Array(12);
  crypto.getRandomValues(salt);
  crypto.getRandomValues(iv);

  const key = await keyFrom(code, salt);
  const sealed = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv as BufferSource }, key, packed as BufferSource),
  );

  const out = new Uint8Array(salt.length + iv.length + sealed.length);
  out.set(salt, 0);
  out.set(iv, salt.length);
  out.set(sealed, salt.length + iv.length);
  return PREFIX + toB64Url(out);
}

export class WrongCode extends Error {}
export class BadSnapshot extends Error {}

export async function decodeSnapshot(payload: string, code: string): Promise<State> {
  const text = payload.trim();
  const body = text.includes(PREFIX) ? text.slice(text.indexOf(PREFIX) + PREFIX.length) : '';
  /* Wording here stays neutral about link-versus-text: the installed app has no
     web address to offer, so it hands the same payload over as text to paste, and
     these sentences are shown in both. */
  if (!body) throw new BadSnapshot('That is not something Sprout can open.');

  let raw: Uint8Array;
  try {
    raw = fromB64Url(body);
  } catch {
    throw new BadSnapshot('That looks damaged — copy the whole thing and try again.');
  }
  if (raw.length < 30) throw new BadSnapshot('That looks cut short — copy the whole thing.');

  const salt = raw.slice(0, 16);
  const iv = raw.slice(16, 28);
  const sealed = raw.slice(28);

  let packed: Uint8Array;
  try {
    const key = await keyFrom(code, salt);
    packed = new Uint8Array(
      await crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv as BufferSource }, key, sealed as BufferSource),
    );
  } catch {
    /* AES-GCM fails closed: a wrong code and a tampered payload are the same
       failure, and neither one leaks which. */
    throw new WrongCode('That code does not match this family.');
  }

  const zipped = packed[0] === 1;
  const body2 = packed.slice(1);
  const json = new TextDecoder().decode(zipped ? await through(body2, 'gunzip') : body2);

  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new BadSnapshot('It unlocked, but the family inside is unreadable.');
  }
  if (!looksLikeState(parsed)) throw new BadSnapshot('That is from a different version of Sprout.');
  return parsed;
}

function looksLikeState(v: unknown): v is State {
  if (typeof v !== 'object' || v === null) return false;
  const s = v as Partial<State>;
  return (
    typeof s.version === 'number' &&
    typeof s.family === 'object' &&
    s.family !== null &&
    Array.isArray(s.family.parents) &&
    Array.isArray(s.family.children) &&
    Array.isArray(s.entries) &&
    Array.isArray(s.jobs)
  );
}

/** The link a parent sends themselves. The payload sits in the hash, so it is
 *  never sent to any server even if the page is hosted on one. */
export function joinLink(payload: string): string {
  /* The app's own base, not location.pathname — the link is always made from a
     screen deep inside the app, and pathname would bake that route into it
     (/parent/devices/join, which routes to nothing). */
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${location.origin}${base}/join#${payload}`;
}

/**
 * Whether the app is running inside its own native shell rather than a browser.
 *
 * This matters in exactly one place. A join link is only a link if the other
 * device can open the address at the front of it, and inside the APK that address
 * is `https://localhost` — this phone, and nowhere else. Offering it anyway would
 * be handing a parent something that looks tappable and cannot work. So the shell
 * shows the payload on its own, as a long code to paste, and says so.
 *
 * Read off the injected global instead of importing @capacitor/core, so the web
 * build carries no Capacitor code at all.
 */
export function isNativeShell(): boolean {
  const cap = (globalThis as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  return typeof cap?.isNativePlatform === 'function' && cap.isNativePlatform() === true;
}

/* --- This device ---------------------------------------------------------- */

/** Stable per-browser id, so the device list can say "this one". */
export function deviceId(): string {
  try {
    const existing = localStorage.getItem(DEVICE_KEY);
    if (existing) return existing;
    const id = `d_${toB64Url(crypto.getRandomValues(new Uint8Array(6)))}`;
    localStorage.setItem(DEVICE_KEY, id);
    return id;
  } catch {
    return 'd_unknown';
  }
}

/** A first guess at a name the parent will recognise. Always editable. */
export function guessDeviceName(): string {
  const ua = navigator.userAgent;
  if (/iPad/.test(ua)) return 'iPad';
  if (/iPhone/.test(ua)) return 'iPhone';
  if (/Android/.test(ua)) return /Mobile/.test(ua) ? 'Android phone' : 'Android tablet';
  if (/Macintosh/.test(ua)) return 'Mac';
  if (/Windows/.test(ua)) return 'Windows computer';
  return 'This device';
}
