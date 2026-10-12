"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Heart, ShoppingCart } from "lucide-react";
import {DialogFocus} from '@/components/ui/DialogFocus';
import {RemoveScroll} from 'react-remove-scroll';
import {colorName, effectivePrice} from '@/lib/catalog-utils';
import Link from "next/link";
import { useFavoritesStore } from "@/store/favorites";
import { getAllProducts } from "@/lib/data";
import { formatPrice } from "@/lib/utils";
import { useLanguage } from "@/i18n";
import { ProductImage } from "@/components/ui/ProductImage";
import { useMemo, useEffect } from "react";

export function FavoritesDrawer() {
  const { isOpen, closeFavorites, productIds, removeFavorite } = useFavoritesStore();
  const { t, language } = useLanguage();
  
  const favorites = useMemo(() => {
    const allProducts = getAllProducts();
    return allProducts.filter(p => productIds.includes(p.id));
  }, [productIds]);

  const isEmpty = favorites.length === 0;

  useEffect(() => {const key = (e: KeyboardEvent) => {if (e.key === 'Escape') closeFavorites();}; if (isOpen) window.addEventListener('keydown', key);return () => window.removeEventListener('keydown', key);}, [isOpen, closeFavorites]);

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
            onClick={closeFavorites}
          />

          {/* Drawer */}
          <RemoveScroll><motion.div role="dialog" aria-modal="true" aria-label={t.favorites.title}
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
                {t.favorites.title}
              </h2>
              <button
                onClick={closeFavorites}
                className="p-2 hover:bg-rrc-panel transition-colors group"
                aria-label={t.common.close}
              >
                <X className="w-5 h-5 text-rrc-white group-hover:text-rrc-wine transition-colors" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {isEmpty ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <Heart className="w-12 h-12 text-rrc-off mb-4" />
                  <p className="text-rrc-off mb-6">{t.favorites.empty}</p>
                  <Link
                    href="/shop"
                    onClick={closeFavorites}
                    className="inline-flex items-center justify-center px-6 py-3 text-[11px] font-mono tracking-widest uppercase border border-rrc-line text-rrc-white hover:border-rrc-wine hover:text-rrc-wine transition-colors"
                  >
                    {t.shop.all}
                  </Link>
                </div>
              ) : (
                <div className="space-y-6">
                  {favorites.map((product, index) => (
                    <motion.div
                      key={product.id}
                      className="flex gap-4 pb-6 border-b border-rrc-line last:border-0"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      {/* Image */}
                      <Link
                        href={`/product/${product.slug}`}
                        onClick={closeFavorites}
                        className="w-24 h-32 bg-rrc-panel flex-shrink-0 relative overflow-hidden"
                      >
                        <ProductImage
                          src={product.images[0] || "/images/product-placeholder.svg"}
                          alt={product.name}
                          sizes="100px"
                        />
                      </Link>

                      {/* Info */}
                      <div className="min-w-0 flex-1 flex flex-col">
                        <div className="flex justify-between items-start mb-2">
                          <Link
                            href={`/product/${product.slug}`}
                            onClick={closeFavorites}
                            className="flex-1"
                          >
                            <h3 className="font-mono text-sm uppercase tracking-wide text-rrc-white hover:text-rrc-wine transition-colors">
                              {product.name}
                            </h3>
                            <p className="text-t-micro text-rrc-off mt-1">
                              {colorName(product.colors?.[0]?.name ?? "", language)}
                            </p>
                          </Link>
                          <button
                            onClick={() => removeFavorite(product.id)}
                            className="p-2 hover:text-rrc-wine transition-colors -mr-2"
                            aria-label={t.favorites.remove}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="flex items-center gap-3 mt-auto">
                          <span className="text-sm text-rrc-white">
                            {typeof product.price === "number"
                              ? formatPrice(effectivePrice(product)!)
                              : language === 'ru' ? 'ЦЕНА ПО ЗАПРОСУ' : 'PRICE ON REQUEST'}
                          </span>
                          <Link
                            href={`/product/${product.slug}`}
                            onClick={closeFavorites}
                            className="ml-auto flex items-center gap-1 text-[10px] uppercase tracking-wider text-rrc-off hover:text-rrc-white transition-colors"
                          >
                            <ShoppingCart className="w-3 h-3" />
                            {t.favorites.addToCart}
                          </Link>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div></RemoveScroll>
        </>
      )}
    </AnimatePresence>
  );
}
