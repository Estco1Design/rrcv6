// Edge-compatible signed, expiring session. Never import this module in UI.
export const PRIVATE_ACCESS_COOKIE = 'rrc_private_access';
export const SESSION_SECONDS = 60 * 60 * 24 * 7;
const encoder = new TextEncoder();
function secret() { const value = process.env.RRC_PRIVATE_SESSION_SECRET ?? ''; return value.length >= 32 ? value : null; }
function encode(bytes: Uint8Array) { return btoa(String.fromCharCode(...Array.from(bytes))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
function decode(value: string) { return Uint8Array.from(atob(value.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0)); }
async function key() { const value = secret(); return value ? crypto.subtle.importKey('raw', encoder.encode(value), {name: 'HMAC', hash: 'SHA-256'}, false, ['sign', 'verify']) : null; }
export function isSessionConfigured() { return secret() !== null; }
export async function createPrivateToken() {
  const signingKey = await key();
  if (!signingKey) throw new Error('Private access is not configured');
  const payload = `${Math.floor(Date.now() / 1000) + SESSION_SECONDS}.${crypto.randomUUID()}`;
  const signature = await crypto.subtle.sign('HMAC', signingKey, encoder.encode(payload));
  return `${payload}.${encode(new Uint8Array(signature))}`;
}
export async function verifyPrivateToken(token: string | undefined) {
  try {
    if (!token || token.length > 200) return false;
    const parts = token.split('.');
    if (parts.length !== 3 || !/^\d+$/.test(parts[0]) || !/^[a-f0-9-]{36}$/.test(parts[1])) return false;
    const expires = Number(parts[0]); const now = Math.floor(Date.now() / 1000);
    if (expires <= now || expires > now + SESSION_SECONDS) return false;
    const signingKey = await key();
    return signingKey ? crypto.subtle.verify('HMAC', signingKey, decode(parts[2]), encoder.encode(`${parts[0]}.${parts[1]}`)) : false;
  } catch { return false; }
}
