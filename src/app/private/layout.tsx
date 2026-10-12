import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { hasPrivateAccessSession } from '@/lib/private-access';
import { PrivateHeader } from '@/components/private/PrivateHeader';

/**
 * RRC PRIVATE — отдельная приватная зона сайта.
 *
 * - Server-side защита: без httpOnly-cookie rrc_private_access → редирект
 *   на / (обычный сайт). Middleware дублирует проверку на edge.
 * - Визуально НЕ копия публичного сайта: собственный минималистичный
 *   header (RRC PRIVATE / MEMBER ACCESS / EXIT), без публичного Header,
 *   MobileNav, CartDrawer и Footer.
 * - Intro сюда не монтируется (приватный UX отдельный).
 */

export const metadata: Metadata = {
  title: 'RRC PRIVATE — Member Access',
  description: 'Private area of RICHRUSSIANCOMMUNITY.',
  robots: { index: false, follow: false },
};

export default async function PrivateLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  if (!(await hasPrivateAccessSession())) {
    redirect('/');
  }

  return (
    <div data-rrc-private="" className="flex min-h-screen flex-col bg-black">
      <PrivateHeader />
      <main className="flex-1">{children}</main>
    </div>
  );
}
