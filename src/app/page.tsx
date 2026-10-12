"use client";

import { useLanguage } from "@/i18n";
import Layout from "@/components/layout/Layout";
import Link from "next/link";
import { HeroSection } from "@/components/home/HeroSection";
import { ManifestoSection } from "@/components/home/ManifestoSection";
import { getFeaturedProducts } from "@/lib/products";
import {SceneReveal} from "@/components/home/SceneReveal";
import {CampaignSection} from "@/components/home/CampaignSection";
import { ProductCard } from "@/components/product/ProductCard";

export default function HomePage() {
  const {language} = useLanguage();
  // The home selection follows CURRENT, with no archived or hidden cards.
  const featured = getFeaturedProducts(6);
  const [heroProduct, ...restProducts] = featured;

  return (
    <Layout>
      {/* HERO SECTION - Full screen with animations */}
      <HeroSection />

      {/* MANIFESTO SECTION */}
      <SceneReveal><ManifestoSection /></SceneReveal>

      {/* FEATURED PRODUCTS SECTION */}
      <section id="current-selection" className="scroll-mt-24 py-16 md:py-24 px-4 md:px-8"><SceneReveal>
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="flex items-end justify-between mb-12 md:mb-16">
            <div>
              <h2 className="font-display text-2xl md:text-3xl font-light tracking-wide text-rrc-white uppercase mb-2">
                {language === 'ru' ? 'НОВЫЕ ОБЪЕКТЫ' : 'NEW OBJECTS'}
              </h2>
              <p className="text-t-micro text-rrc-off tracking-widest uppercase">
                NEW OBJECTS — RICH RUSSIAN COMMUNITY
              </p>
            </div>
            <Link
              href="/shop?section=current"
              className="hidden md:inline-flex items-center gap-2 text-t-ui tracking-widest text-rrc-silver hover:text-rrc-white transition-colors group"
            >
              {language === 'ru' ? 'ВСЕ ТОВАРЫ' : 'VIEW ALL'}
              <svg
                className="w-4 h-4 transform group-hover:translate-x-1 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>

          {/* Featured grid: первая карточка увеличенная (главный продукт — кожаная куртка) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {heroProduct && (
              <ProductCard
                product={heroProduct}
                index={0}
                layoutClass="col-span-2 md:col-span-2 md:row-span-2"
              />
            )}
            {restProducts.map((product, idx) => (
              <ProductCard key={product.id} product={product} index={idx + 1} />
            ))}
          </div>

          {/* Mobile CTA */}
          <div className="mt-12 text-center md:hidden">
            <Link
              href="/shop?section=current"
              className="inline-flex items-center justify-center px-6 py-3 text-[11px] font-mono tracking-widest uppercase border border-rrc-line text-rrc-white hover:border-rrc-wine hover:text-rrc-wine transition-colors"
            >
              {language === 'ru' ? 'ВСЕ ТОВАРЫ' : 'VIEW ALL'}
            </Link>
          </div>
        </div>
      </SceneReveal></section>

      <CampaignSection />
    </Layout>
  );
}
