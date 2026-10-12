import 'server-only';
import { cookies } from 'next/headers';
import { PRIVATE_ACCESS_COOKIE, verifyPrivateToken, isSessionConfigured } from './private-token';
export { PRIVATE_ACCESS_COOKIE } from './private-token';
export function getPrivateAccessCodes() {
  return (process.env.RRC_PRIVATE_CODES ?? '').split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
}
export function normalizeAccessCode(input: string) { return input.trim().toUpperCase(); }
export function isPrivateAccessConfigured() { return isSessionConfigured() && getPrivateAccessCodes().length > 0; }
export function verifyPrivateAccessCode(input: string) {
  const code = normalizeAccessCode(input);
  return isPrivateAccessConfigured() && code.length > 0 && code.length <= 100 && getPrivateAccessCodes().includes(code);
}
export async function hasPrivateAccessSession() {
  return verifyPrivateToken((await cookies()).get(PRIVATE_ACCESS_COOKIE)?.value);
}
