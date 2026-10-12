import type { Product, CartItem } from '@/lib/schemas';
export function effectivePrice(product: Pick<Product, 'price' | 'salePrice'>): number | null {
  if (product.price == null) return null;
  return product.salePrice != null && product.salePrice < product.price ? product.salePrice : product.price;
}
export function cartTotals(items: CartItem[]) {
  const subtotal = items.reduce((sum, item) => sum + (item.price ?? 0) * item.quantity, 0);
  const hasUnpricedItems = items.some(item => item.price == null);
  const shipping = items.length === 0 ? 0 : null;
  return { subtotal, shipping, total: shipping == null ? null : subtotal + shipping,
    hasUnpricedItems, itemCount: items.reduce((sum, item) => sum + item.quantity, 0) };
}
export function categoryName(category: string | null, language: 'ru' | 'en') {
  const names: Record<string, [string, string]> = {outerwear: ['ВЕРХНЯЯ ОДЕЖДА','OUTERWEAR'], hoodies: ['ХУДИ','HOODIES'], tops: ['ВЕРХ','TOPS'], bottoms: ['БРЮКИ И ЛЕГГИНСЫ','BOTTOMS']};
  return names[category ?? '']?.[language === 'ru' ? 0 : 1] ?? category ?? '';
}
export function colorName(color: string, language: 'ru' | 'en') {
  if (language === 'en') return color;
  const names: Record<string, string> = {Black:'Чёрный',White:'Белый',Grey:'Серый','Ivory / Milk':'Молочный','Acid Green':'Кислотный зелёный','Blue / Beige Leopard':'Синий / бежевый леопард'};
  return names[color] ?? color;
}
