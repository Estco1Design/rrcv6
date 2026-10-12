'use client';
import type { CartItem } from '@/lib/schemas';
import { cartTotals } from '@/lib/catalog-utils';
import { formatPrice } from '@/lib/utils';
import { useLanguage } from '@/i18n';
export function CartSummary({items}: {items: CartItem[]}) {
  const {language} = useLanguage(); const ru = language === 'ru';
  const totals = cartTotals(items);
  return <div className="space-y-3 mb-6 text-sm">
    <div className="flex justify-between gap-4"><span className="text-rrc-off">{ru ? 'Стоимость изделий' : 'Items'}</span><span>{totals.hasUnpricedItems ? (ru ? 'Уточняется' : 'On request') : formatPrice(totals.subtotal)}</span></div>
    <div className="flex justify-between gap-4"><span className="text-rrc-off">{ru ? 'Доставка' : 'Shipping'}</span><span>{totals.shipping == null ? (ru ? 'По тарифу перевозчика' : 'Carrier tariff') : formatPrice(totals.shipping)}</span></div>
    <div className="border-t border-rrc-line pt-3 flex justify-between gap-4"><span>{ru ? 'Итого' : 'Total'}</span><span>{totals.total == null ? (ru ? 'После подтверждения' : 'To be confirmed') : formatPrice(totals.total)}</span></div>
    {totals.hasUnpricedItems && <p className="text-xs text-rrc-off leading-relaxed">{ru ? 'Стоимость, наличие и срок изготовления подтвердим перед оплатой.' : 'We will confirm pricing, availability and production time before payment.'}</p>}
    {!totals.hasUnpricedItems && items.length > 0 && <p className="text-xs text-rrc-off leading-relaxed">{ru ? 'Стоимость доставки и полный итог подтвердим до оплаты.' : 'Shipping cost and the full total will be confirmed before payment.'}</p>}
  </div>;
}
