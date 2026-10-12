"use client";
import {selectedSizeLabel} from '@/lib/sizing';

import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Minus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useCartStore, useCartTotals } from "@/store/cart";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { ProductImage } from "@/components/ui/ProductImage";
import {DialogFocus} from '@/components/ui/DialogFocus';
import { CartSummary } from '@/components/cart/CartSummary';
import { RemoveScroll } from 'react-remove-scroll';
import { useEffect } from 'react';
import { colorName } from '@/lib/catalog-utils';
import { useLanguage } from "@/i18n";

export function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity } = useCartStore();
  const { subtotal } = useCartTotals();
  const { t, language } = useLanguage();
  const isEmpty = items.length === 0;

  useEffect(() => {const key = (e: KeyboardEvent) => {if (e.key === 'Escape') closeCart();}; if (isOpen) window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key);}, [isOpen, closeCart]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/60 z-[70]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={closeCart}
          />

          {/* Drawer */}
          <RemoveScroll><motion.div
            role="dialog" aria-modal="true" aria-label={t.cart.title}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-rrc-coal z-[71] flex flex-col"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <DialogFocus/>
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-rrc-line">
              <h2 className="font-display text-lg font-bold uppercase tracking-wider">
                {t.cart.title}
              </h2>
              <button
                onClick={closeCart}
                className="p-2 hover:bg-rrc-panel transition-colors"
                aria-label={t.common.close}
              >
                <X className="w-5 h-5 text-rrc-white" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {isEmpty ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <p className="text-rrc-off mb-6">{t.cart.empty}</p>
                  <Link href="/shop?section=current" onClick={closeCart}>
                    <Button variant="outline">{t.cart.continueShopping}</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-6">
                  {items.map((item, index) => (
                    <motion.div
                      key={item.variantId}
                      className="flex gap-4 pb-6 border-b border-rrc-line"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      {/* Image */}
                      <div className="w-24 h-32 bg-rrc-panel flex-shrink-0 relative overflow-hidden">
                        <ProductImage
                          src={item.image || "/images/product-placeholder.svg"}
                          alt={item.name}
                          sizes="100px"
                        />
                      </div>

                      {/* Info */}
                      <div className="min-w-0 flex-1 flex flex-col">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-mono text-sm uppercase tracking-wide text-rrc-white">
                              {item.name}
                            </h3>
                            <p className="text-t-micro text-rrc-off mt-1">
                              {colorName(item.color, language)}{` / ${selectedSizeLabel(item, language)}`}
                            </p>
                          </div>
                          <button
                            onClick={() => removeItem(item.variantId)}
                            className="p-1 hover:text-rrc-wine transition-colors"
                            aria-label={t.cart.remove}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 mt-auto">
                          <div className="flex items-center border border-rrc-line">
                            <button
                              aria-label={language === 'ru' ? 'Уменьшить количество' : 'Decrease quantity'}
                              onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                              className="p-2 hover:bg-rrc-panel disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="px-3 text-sm">{item.quantity}</span>
                            <button
                              aria-label={language === 'ru' ? 'Увеличить количество' : 'Increase quantity'}
                              onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                              disabled={item.quantity >= 10}
                              className="p-2 hover:bg-rrc-panel disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <span className="text-sm text-rrc-white ml-auto">
                            {typeof item.price === "number"
                              ? formatPrice(item.price * item.quantity)
                              : language === 'ru' ? 'ЦЕНА ПО ЗАПРОСУ' : 'PRICE ON REQUEST'}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {!isEmpty && (
              <motion.div
                className="border-t border-rrc-line p-6 space-y-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <CartSummary items={items} />

                {/* Checkout Button */}
                <Link href="/cart" onClick={closeCart} className="block">
                  <Button fullWidth size="lg">
                    {language === 'ru' ? 'ОТКРЫТЬ КОРЗИНУ' : 'OPEN BAG'}
                  </Button>
                </Link>
              </motion.div>
            )}
          </motion.div></RemoveScroll>
        </>
      )}
    </AnimatePresence>
  );
}
