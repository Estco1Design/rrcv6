import type {CartItem} from '@/lib/schemas';
export const rrcSizeGuide: Record<string, string> = {'1': 'S / M', '2': 'M / L', '3': 'L / XL'};
export function selectedSizeLabel(item: Pick<CartItem, 'size' | 'fitRequest'>, language: 'ru' | 'en') {
 const size = item.size ? `${item.size}${rrcSizeGuide[item.size] ? ` (${rrcSizeGuide[item.size]})` : ''}` : (language === 'ru' ? 'Размер уточнить' : 'Size to confirm');
 return size + (item.fitRequest === 'oversize' ? (language === 'ru' ? ' · Свободнее — запрос' : ' · Looser fit — request') : '');
}
