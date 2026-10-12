import {preorderTerms} from '@/config/site';
import {selectedSizeLabel} from '@/lib/sizing';
import {getAllProducts} from '@/lib/products';
import type { CartItem } from '@/lib/schemas';
import { cartTotals, colorName } from '@/lib/catalog-utils';
import { formatPrice } from '@/lib/utils';
export interface DeliveryPreference {carrier: string; postalCode: string; destination: string}
export function buildOrderRequest(items: CartItem[], language: 'ru' | 'en', name: string, city: string, note: string, origin: string, delivery?: DeliveryPreference) {
  const ru = language === 'ru'; const totals = cartTotals(items);
  const lines = [ru ? 'RRC — запрос заказа' : 'RRC — order enquiry', ''];
  items.forEach((item, i) => {
    const preorder = getAllProducts().some(p => p.id === item.productId && p.preorder);
    lines.push(`${i + 1}. ${item.name}${preorder ? " — PRE-ORDER" : ""}`, `${colorName(item.color, language)} / ${selectedSizeLabel(item, language)} / ${item.quantity} ${ru ? 'шт.' : 'pcs'}`,
      item.price == null ? (ru ? 'Цена по запросу' : 'Price on request') : formatPrice(item.price * item.quantity), `${origin}/product/${item.slug}`, '');
  });
  if (!totals.hasUnpricedItems) lines.push(`${ru ? 'Стоимость изделий' : 'Items subtotal'}: ${formatPrice(totals.subtotal)}`);
  lines.push(ru ? 'Доставка: по тарифу перевозчика, стоимость подтвердить до оплаты.' : 'Shipping: carrier tariff; cost to be confirmed before payment.', '');
  if(items.some(item=>getAllProducts().some(p=>p.id===item.productId && p.preorder))) lines.push(preorderTerms(language), '');
  if(delivery) {
    lines.push(`${ru ? 'Предпочитаемая доставка' : 'Preferred carrier'}: ${delivery.carrier}`);
    if(delivery.postalCode.trim()) lines.push(`${ru ? 'Индекс' : 'Postal code'}: ${delivery.postalCode.trim()}`);
    if(delivery.destination.trim()) lines.push(`${ru ? 'ПВЗ / адрес' : 'Pickup point / address'}: ${delivery.destination.trim()}`);
  }
  if (name.trim()) lines.push(`${ru ? 'Имя' : 'Name'}: ${name.trim()}`);
  if (city.trim()) lines.push(`${ru ? 'Город' : 'City'}: ${city.trim()}`);
  if (note.trim()) lines.push(`${ru ? 'Комментарий' : 'Note'}: ${note.trim()}`);
  lines.push('', ru ? 'Подтвердите, пожалуйста, стоимость, размеры, наличие и сроки изготовления / отправки.' : 'Please confirm pricing, sizes, availability and production / shipping times.');
  return lines.join('\n');
}
