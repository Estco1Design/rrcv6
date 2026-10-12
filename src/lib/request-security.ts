import type { NextRequest } from 'next/server';
export function sameOrigin(req: NextRequest) {
  const origin = req.headers.get('origin');
  if (!origin) return false;
  try {
    const source = new URL(origin);
    // Next may normalise the internal hostname; the Host header identifies the public request.
    const host = req.headers.get('host');
    const protocol = req.headers.get('x-forwarded-proto')?.split(',')[0]?.trim() || req.nextUrl.protocol.replace(':', '');
    return !!host && source.host === host && source.protocol === `${protocol}:`;
  } catch { return false; }
}
// Per-process abuse limiter. Use an upstream distributed limiter on multi-instance hosting.
const attempts = new Map<string, {count: number; expires: number}>();
export function allowAttempt(req: NextRequest) {
  const now = Date.now();
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const record = attempts.get(ip);
  if (!record || record.expires <= now) {
    if (attempts.size >= 1000) { for (const [key, value] of attempts) if (value.expires <= now) attempts.delete(key); if (attempts.size >= 1000) return false; }
    attempts.set(ip, {count: 1, expires: now + 60000}); return true;
  }
  record.count += 1;
  return record.count <= 10;
}
