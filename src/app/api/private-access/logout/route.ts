import { NextRequest, NextResponse } from 'next/server';
import { PRIVATE_ACCESS_COOKIE } from '@/lib/private-token';
import { sameOrigin } from '@/lib/request-security';
export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return NextResponse.json({ok: false}, {status: 403});
  const response = NextResponse.json({ok: true}, {headers: {'Cache-Control':'no-store'}});
  response.cookies.set(PRIVATE_ACCESS_COOKIE, '', {httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 0});
  return response;
}
