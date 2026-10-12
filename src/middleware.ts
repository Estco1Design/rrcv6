import { NextRequest, NextResponse } from 'next/server';
import { PRIVATE_ACCESS_COOKIE, verifyPrivateToken } from '@/lib/private-token';
export async function middleware(req: NextRequest) {
  if (await verifyPrivateToken(req.cookies.get(PRIVATE_ACCESS_COOKIE)?.value)) return NextResponse.next();
  if (req.nextUrl.pathname === '/private') return NextResponse.redirect(new URL('/', req.url));
  return new NextResponse(null, {status: 404});
}
export const config = {matcher: ['/private/:path*']};
