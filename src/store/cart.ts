import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { cartItemSchema, type CartItem } from '@/lib/schemas';
import { getAllProducts } from '@/lib/products';
import { cartTotals, effectivePrice } from '@/lib/catalog-utils';
interface CartStore {
  items: CartItem[];
  selectedItems: Set<string>;
  isOpen: boolean;
  hydrated: boolean;
  addItem: (item: CartItem) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  closeCart: () => void;
  openCart: () => void;
  toggleItemSelection: (variantId: string) => void;
  selectAllItems: () => void;
  deselectAllItems: () => void;
  removeSelectedItems: () => void;
  markHydrated: () => void;
}
// Restore old baskets by variant, refresh catalogue data, and discard invalid items.
export function restoreCart(saved: unknown): Pick<CartStore, 'items' | 'selectedItems'> {
  const persisted = saved && typeof saved === 'object' ? saved as {items?: unknown; selectedItems?: unknown} : {};
  const legacySelection = Array.isArray(persisted.selectedItems) ? persisted.selectedItems.filter((x): x is string => typeof x === 'string') : null;
  const items: CartItem[] = [];
  const selectedItems = new Set<string>();
  for (const candidate of Array.isArray(persisted.items) ? persisted.items : []) {
    const parsed = cartItemSchema.safeParse(candidate);
    if (!parsed.success) continue;
    const old = parsed.data;
    const product = getAllProducts().find(p => p.id === old.productId);
    const color = product?.colors.find(c => c.name === old.color);
    if (!product || !color || (old.size !== null && !product.sizes.includes(old.size))) continue;
    const id = `${product.id}-${color.name}-${old.size ?? 'default'}${old.fitRequest === 'oversize' ? '-oversize-request' : ''}`;
    const previous = items.find(item => item.id === id);
    if (previous) previous.quantity = Math.min(10, previous.quantity + old.quantity);
    else items.push({...old, id, variantId: id, slug: product.slug, name: product.name, price: effectivePrice(product), image: color.images[0] ?? '/images/product-placeholder.svg'});
    if (legacySelection === null || legacySelection.includes(old.id) || legacySelection.includes(old.variantId)) selectedItems.add(id);
  }
  return {items, selectedItems};
}
export const useCartStore = create<CartStore>()(persist((set, get) => ({
  items: [], selectedItems: new Set(), isOpen: false, hydrated: false,
  markHydrated: () => set({hydrated: true}),
  addItem: (item) => set(state => {
    const normalized = restoreCart({items: [item]}).items[0];
    if (!normalized) return state;
    const existing = state.items.find(i => i.variantId === normalized.variantId);
    const items = existing ? state.items.map(i => i.variantId === normalized.variantId ? {...i, quantity: Math.min(i.quantity + normalized.quantity, 10)} : i) : [...state.items, normalized];
    return {items, selectedItems: new Set([...state.selectedItems, normalized.variantId])};
  }),
  removeItem: id => set(state => ({items: state.items.filter(i => i.variantId !== id), selectedItems: new Set([...state.selectedItems].filter(x => x !== id))})),
  updateQuantity: (id, quantity) => { if (Number.isInteger(quantity) && quantity >= 1 && quantity <= 10) set(state => ({items: state.items.map(i => i.variantId === id ? {...i, quantity} : i)})); },
  clearCart: () => set({items: [], selectedItems: new Set()}),
  toggleCart: () => set(state => ({isOpen: !state.isOpen})),
  closeCart: () => set({isOpen: false}), openCart: () => set({isOpen: true}),
  toggleItemSelection: id => set(state => {const selectedItems = new Set(state.selectedItems); if (selectedItems.has(id)) selectedItems.delete(id); else if (state.items.some(i => i.variantId === id)) selectedItems.add(id); return {selectedItems};}),
  selectAllItems: () => set({selectedItems: new Set(get().items.map(i => i.variantId))}),
  deselectAllItems: () => set({selectedItems: new Set()}),
  removeSelectedItems: () => set(state => ({items: state.items.filter(i => !state.selectedItems.has(i.variantId)), selectedItems: new Set()})),
}), {
  name: 'rrc-cart-storage', skipHydration: true, storage: createJSONStorage(() => localStorage),
  partialize: state => ({items: state.items, selectedItems: [...state.selectedItems]}),
  merge: (persisted, current) => ({...current, ...restoreCart(persisted), isOpen: false}),
  onRehydrateStorage: () => state => state?.markHydrated(),
}));
export function useCartTotals() { return cartTotals(useCartStore(state => state.items)); }
