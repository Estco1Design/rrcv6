// Public contact settings. Only use verified brand accounts.
function telegramHandle(value: string | undefined): string {
  const handle = (value ?? '').trim().replace(/^https:\/\/t\.me\//, '').replace(/^@/, '').replace(/\/$/, '');
  return /^[a-zA-Z][a-zA-Z0-9_]{4,31}$/.test(handle) ? handle : '';
}
function publicUrl(value: string | undefined, host: string): string {
  try { const url = new URL(value ?? ''); return url.protocol === 'https:' && url.hostname === host ? url.href : ''; } catch { return ''; }
}
export const siteConfig = {
  telegram: telegramHandle(process.env.NEXT_PUBLIC_RRC_TELEGRAM || 'rrc_support'),
  channel: 'richrussiancommunity',
  team: ['platoneestco', 'TailoredByRRC'],
  vk: publicUrl(process.env.NEXT_PUBLIC_RRC_VK, 'vk.com'),
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(process.env.NEXT_PUBLIC_RRC_EMAIL ?? '') ? process.env.NEXT_PUBLIC_RRC_EMAIL! : '',
  url: publicUrl(process.env.NEXT_PUBLIC_SITE_URL, (() => { try { return new URL(process.env.NEXT_PUBLIC_SITE_URL ?? '').hostname; } catch { return ''; } })()),
};
export const telegramUrl = siteConfig.telegram ? `https://t.me/${siteConfig.telegram}` : '';
export const contactHref = telegramUrl || (siteConfig.email ? `mailto:${siteConfig.email}` : '/contacts');
export const channelUrl = `https://t.me/${siteConfig.channel}`;
// Carrier tariffs are not replaced with a fixed estimate or free-shipping promise.
export const shippingPolicy = { mode: 'carrier', origin: 'Малаховка, Просечная, 14' } as const;

export const productionPolicy = { workingDays: 14, prepaidPercent: 100, timeZone: 'Europe/Moscow' } as const;
// Supplied by owner; no claim that a current registry extract was verified.
export const sellerConfig = {inn:'026812575905',ogrnip:'319502700037778',registrationDate:'2019-04-24'} as const;
export function preorderTerms(language: 'ru' | 'en') {
 return language === 'ru'
  ? 'Предзаказ — 100% предоплата. Изготовление до 14 рабочих дней с даты подтверждённой оплаты: понедельник–пятница. День оплаты в будни считается первым; при оплате в выходные отсчёт начинается в понедельник. Суббота и воскресенье не учитываются. Доставка отдельно.'
  : 'Pre-orders require 100% advance payment. Production takes up to 14 working days from confirmed payment, Monday–Friday. A weekday payment date counts as day one; weekend payments start on Monday. Saturdays and Sundays are excluded. Shipping is additional.';
}
