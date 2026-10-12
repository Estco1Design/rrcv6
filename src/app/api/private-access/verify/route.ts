import { NextRequest, NextResponse } from 'next/server';
import { isPrivateAccessConfigured, verifyPrivateAccessCode } from '@/lib/private-access';
import { PRIVATE_ACCESS_COOKIE, SESSION_SECONDS, createPrivateToken } from '@/lib/private-token';
import { sameOrigin, allowAttempt } from '@/lib/request-security';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return NextResponse.json({ok: false}, {status: 403});
  if (!allowAttempt(req)) return NextResponse.json({ok: false}, {status: 429, headers: {'Retry-After': '60'}});
  if (!isPrivateAccessConfigured()) return NextResponse.json({ok: false}, {status: 503});
  if (Number(req.headers.get('content-length') ?? 0) > 4096) return NextResponse.json({ok: false}, {status: 413});
  let code = '';
  try { const raw = await req.text(); if (raw.length > 4096) return NextResponse.json({ok: false}, {status: 413}); const body = JSON.parse(raw); code = typeof body?.code === 'string' ? body.code : ''; } catch { return NextResponse.json({ok: false}, {status: 400}); }
  if (!verifyPrivateAccessCode(code)) return NextResponse.json({ok: false, valid: false}, {status: 401});
  const res = NextResponse.json({ok: true, valid: true}, {headers: {'Cache-Control': 'no-store'}});
  res.cookies.set(PRIVATE_ACCESS_COOKIE, await createPrivateToken(), {httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: SESSION_SECONDS});
  return res;
}
