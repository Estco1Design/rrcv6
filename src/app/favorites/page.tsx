"use client";

import { useFavoritesStore } from "@/store/favorites";
import { getAllProducts } from "@/lib/data";
import { ProductCard } from "@/components/product/ProductCard";
import Layout from "@/components/layout/Layout";
import {useLanguage} from "@/i18n";
import Link from "next/link";
import { useMemo } from "react";

export default function FavoritesPage() { return <Layout><FavoritesPageContent /></Layout>; }
function FavoritesPageContent() {
  const {language} = useLanguage(); const ru = language === "ru";
  const { productIds, removeFavorite } = useFavoritesStore();
  
  // Получаем товары из избранного
  const favorites = useMemo(() => {
    const allProducts = getAllProducts();
    return allProducts.filter(p => productIds.includes(p.id));
  }, [productIds]);

  if (favorites.length === 0) {
    return (
      <div className="min-h-screen bg-rrc-black pt-24 px-4 md:px-8">
        <div className="max-w-2xl mx-auto text-center py-20">
          <h1 className="font-display text-2xl md:text-3xl font-medium uppercase tracking-wide text-rrc-white mb-4">
            {ru ? 'ИЗБРАННОЕ' : 'WISHLIST'}
          </h1>
          <p className="text-rrc-off mb-8">{ru ? 'Список избранного пуст' : 'Your wishlist is empty'}</p>
          <Link
            href="/shop?section=current"
            className="inline-flex items-center justify-center px-6 py-3 text-[11px] font-mono tracking-widest uppercase border border-rrc-line text-rrc-white hover:border-rrc-wine hover:text-rrc-wine transition-colors"
          >
            {ru ? 'ПЕРЕЙТИ В КАТАЛОГ' : 'VIEW COLLECTION'}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-rrc-black pt-24 px-4 md:px-8 pb-16">
      <div className="max-w-6xl mx-auto">
        <h1 className="font-display text-2xl md:text-3xl font-medium uppercase tracking-wide text-rrc-white mb-8">
          {ru ? 'ИЗБРАННОЕ' : 'WISHLIST'}
        </h1>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {favorites.map((product) => (
            <div key={product.id} className="relative group">
              <button
                onClick={() => removeFavorite(product.id)}
                className="absolute top-2 right-2 z-10 p-2 bg-rrc-black/80 text-rrc-white opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity hover:text-rrc-wine"
                aria-label={ru ? 'Удалить из избранного' : 'Remove from wishlist'}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
