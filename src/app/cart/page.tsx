"use client";
import {selectedSizeLabel} from '@/lib/sizing';

import { useCartStore } from "@/store/cart";
import { formatPrice } from "@/lib/utils";
import { ChevronLeft, Heart, Minus, Plus, Trash2, Check, ArrowLeft } from "lucide-react";
import { ProductImage } from "@/components/ui/ProductImage";
import Link from "next/link";
import { useLanguage } from '@/i18n';
import Layout from '@/components/layout/Layout';
import { CartSummary } from '@/components/cart/CartSummary';
import { colorName } from '@/lib/catalog-utils';
import { useRouter } from "next/navigation";

export default function CartPage() { return <Layout><CartContent /></Layout>; }
function CartContent() {
  const {language} = useLanguage(); const ru = language === 'ru';
  const router = useRouter();
  const { items, selectedItems, toggleItemSelection, selectAllItems, deselectAllItems, updateQuantity, removeItem, removeSelectedItems } = useCartStore();
  
  const allSelected = items.length > 0 && items.every(item => selectedItems.has(item.variantId));
  const selectedItemsList = items.filter(item => selectedItems.has(item.variantId));
  const selectedCount = selectedItemsList.reduce((sum, item) => sum + item.quantity, 0);

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/shop?section=current");
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-rrc-black pt-20 px-4 md:px-8">
        {/* Back Button */}
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-t-ui tracking-widest text-rrc-off hover:text-rrc-white transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          {ru ? 'НАЗАД' : 'BACK'}
        </button>
        
        <div className="max-w-md mx-auto text-center py-32">
          <h1 className="font-display text-xl md:text-2xl font-medium uppercase tracking-wide text-rrc-white mb-3">
            {ru ? 'КОРЗИНА' : 'BAG'}
          </h1>
          <p className="text-t-ui tracking-widest text-rrc-off mb-10">{ru ? 'Ваша корзина пуста' : 'Your bag is empty'}</p>
          <Link
            href="/shop?section=current"
            className="inline-flex items-center justify-center px-8 py-3 text-[11px] font-mono tracking-widest uppercase border border-rrc-line text-rrc-white hover:border-rrc-wine hover:text-rrc-wine transition-colors"
          >
            {ru ? 'ПЕРЕЙТИ В КАТАЛОГ' : 'VIEW COLLECTION'}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-rrc-black pt-20 px-4 md:px-8 pb-16">
      {/* Back Button */}
      <button
        onClick={handleBack}
        className="flex items-center gap-2 text-t-ui tracking-widest text-rrc-off hover:text-rrc-white transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        {ru ? 'НАЗАД' : 'BACK'}
      </button>

      <div className="max-w-6xl mx-auto">
        <h1 className="font-display text-2xl md:text-3xl font-medium uppercase tracking-wide text-rrc-white mb-8">
          {ru ? 'КОРЗИНА' : 'BAG'}
        </h1>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-rrc-line">
          <div className="flex items-center gap-4">
            <button
              onClick={allSelected ? deselectAllItems : selectAllItems}
              className="flex items-center gap-2 text-t-ui tracking-widest text-rrc-off hover:text-rrc-white transition-colors"
            >
              <div className={`w-5 h-5 border ${allSelected ? 'bg-rrc-wine border-rrc-wine' : 'border-rrc-line'} flex items-center justify-center`}>
                {allSelected && <Check className="w-3 h-3 text-rrc-white" />}
              </div>
              {allSelected ? (ru ? 'СНЯТЬ ВЫБОР' : 'DESELECT ALL') : (ru ? 'ВЫБРАТЬ ВСЁ' : 'SELECT ALL')}
            </button>
            
            {selectedItems.size > 0 && selectedItems.size < items.length && (
              <span className="text-t-micro text-rrc-off">
                {selectedItems.size} {ru ? 'из' : 'of'} {items.length} {ru ? 'выбрано' : 'selected'}
              </span>
            )}
          </div>
          
          {selectedItems.size > 0 && (
            <button
              onClick={removeSelectedItems}
              className="text-t-ui tracking-widest text-rrc-off hover:text-rrc-wine transition-colors flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              {ru ? 'УДАЛИТЬ ВЫБРАННЫЕ' : 'REMOVE SELECTED'}
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <CartItem
                key={item.variantId}
                item={item}
                isSelected={selectedItems.has(item.variantId)}
                onToggleSelection={() => toggleItemSelection(item.variantId)}
                onUpdateQuantity={updateQuantity}
                onRemove={removeItem}
              />
            ))}
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="bg-rrc-coal p-6 sticky top-24 border border-rrc-line">
              <h2 className="font-display text-lg font-medium uppercase tracking-wide text-rrc-white mb-6">
                {ru ? 'ВЫБРАНО' : 'SELECTED'} ({selectedCount})
              </h2>
              
              {selectedItems.size === 0 ? (
                <p className="text-rrc-off text-sm mb-6">{ru ? 'Выберите изделия для запроса' : 'Select items for your request'}</p>
              ) : (
                <CartSummary items={selectedItemsList} />
              )}

              <Link
                href="/checkout" aria-disabled={selectedItems.size === 0}
                className={`block w-full px-6 py-4 text-[11px] font-mono tracking-widest uppercase text-center transition-colors ${
                  selectedItems.size > 0 
                    ? 'bg-rrc-wine text-rrc-white hover:bg-rrc-bordeaux' 
                    : 'bg-rrc-panel text-rrc-off cursor-not-allowed'
                }`}
                onClick={(e) => {
                  if (selectedItems.size === 0) {
                    e.preventDefault();
                  }
                }}
              >
                {selectedItems.size > 0 ? (ru ? 'ЗАПРОСИТЬ ВЫБРАННЫЕ' : 'REQUEST SELECTED') : (ru ? 'ВЫБЕРИТЕ ИЗДЕЛИЯ' : 'SELECT ITEMS')}
              </Link>

              <Link
                href="/shop"
                className="block w-full px-6 py-4 text-[11px] font-mono tracking-widest uppercase border border-rrc-line text-rrc-white hover:border-rrc-wine hover:text-rrc-wine transition-colors text-center mt-3"
              >
                {ru ? 'ПРОДОЛЖИТЬ ПОКУПКИ' : 'CONTINUE SHOPPING'}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface CartItemProps {
  item: import("@/lib/schemas").CartItem;
  isSelected: boolean;
  onToggleSelection: () => void;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
}

function CartItem({ item, isSelected, onToggleSelection, onUpdateQuantity, onRemove }: CartItemProps) {
  const {language} = useLanguage(); const ru = language === 'ru';
  return (
    <div className={`flex gap-4 md:gap-6 p-4 border ${isSelected ? 'bg-rrc-coal border-rrc-wine' : 'bg-rrc-coal border-rrc-line'}`}>
      {/* Checkbox */}
      <button
        onClick={onToggleSelection}
        className={`w-5 h-5 flex-shrink-0 border mt-1 ${isSelected ? 'bg-rrc-wine border-rrc-wine' : 'border-rrc-line'} flex items-center justify-center transition-colors`}
        aria-label={isSelected ? (ru ? 'Снять выбор' : 'Deselect item') : (ru ? 'Выбрать товар' : 'Select item')} aria-pressed={isSelected}
      >
        {isSelected && <Check className="w-3 h-3 text-rrc-white" />}
      </button>
      
      <div className="relative w-16 h-24 sm:w-24 sm:h-32 md:w-32 md:h-40 flex-shrink-0 bg-rrc-panel">
        <ProductImage
          src={item.image || "/images/product-placeholder.svg"}
          alt={item.name}
          sizes="(max-width: 768px) 96px, 128px"
        />
      </div>

      <div className="min-w-0 flex-1 flex flex-col justify-between">
        <div>
          <Link href={`/product/${item.slug}`}>
            <h3 className="font-mono text-sm uppercase tracking-wide text-rrc-white hover:text-rrc-silver transition-colors">
              {item.name}
            </h3>
          </Link>
          <p className="text-t-ui tracking-widest text-rrc-off mt-1">
            {colorName(item.color, language)}{` / ${selectedSizeLabel(item, language)}`}
          </p>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-3 mt-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onUpdateQuantity(item.variantId, Math.max(1, item.quantity - 1))}
              className="p-2 border border-rrc-line text-rrc-white hover:border-rrc-wine transition-colors"
              disabled={item.quantity <= 1} aria-label={ru ? 'Уменьшить количество' : 'Decrease quantity'}
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="w-8 text-center text-sm text-rrc-white">{item.quantity}</span>
            <button
              onClick={() => onUpdateQuantity(item.variantId, Math.min(10, item.quantity + 1))}
              className="p-2 border border-rrc-line text-rrc-white hover:border-rrc-wine transition-colors"
              disabled={item.quantity >= 10} aria-label={ru ? 'Увеличить количество' : 'Increase quantity'}
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>

          <div className="text-right">
            {typeof item.price === "number" ? (
              <p className="text-rrc-white font-medium mb-2">{formatPrice(item.price * item.quantity)}</p>
            ) : (
              <p className="text-t-ui tracking-widest text-rrc-off mb-2">{ru ? 'ЦЕНА ПО ЗАПРОСУ' : 'PRICE ON REQUEST'}</p>
            )}
            <button
              onClick={() => onRemove(item.variantId)}
              className="text-t-ui tracking-widest text-rrc-off hover:text-rrc-wine transition-colors flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
              {ru ? 'УДАЛИТЬ' : 'REMOVE'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
