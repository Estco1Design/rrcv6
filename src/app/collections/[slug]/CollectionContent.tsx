"use client";

import Layout from "@/components/layout/Layout";
import { ProductCard } from "@/components/product/ProductCard";
import { getProductsByCollection, collections } from "@/lib/data";
import { notFound } from "next/navigation";
import { useLanguage } from "@/i18n";

interface CollectionPageProps {
  params: Promise<{ slug: string }>;
}

const collectionNames: Record<string, Record<string, string>> = {
  "fall-2026": { ru: "ОСЕНЬ / ЗИМА 2026", en: "FALL / WINTER 2026" },
  "spring-2026": { ru: "ВЕСНА / ЛЕТО 2026", en: "SPRING / SUMMER 2026" },
  "archive": { ru: "АРХИВ", en: "ARCHIVE" }
};

const collectionDescriptions: Record<string, Record<string, string>> = {
  "fall-2026": {
    ru: "Осенне-зимняя коллекция 2026. Тёмные тона, плотные ткани, архитектурные силуэты.",
    en: "Fall/Winter 2026 collection. Dark tones, dense fabrics, architectural silhouettes."
  },
  "spring-2026": {
    ru: "Весенне-летняя коллекция. Лёгкость, воздух, эксперименты с формой.",
    en: "Spring/Summer 2026 collection. Lightness, air, experiments with form."
  },
  "archive": {
    ru: "Архивные модели прошлых сезонов. Ограниченные экземпляры.",
    en: "Archive models from past seasons. Limited pieces."
  }
};

export default function CollectionContent({ slug }: {slug: string}) {
  const collection = collections.find(c => c.slug === slug);

  if (!collection) {
    notFound();
  }

  const products = getProductsByCollection(collection.id);

  return (
    <Layout>
      <div className="pt-20 md:pt-24 px-4 md:px-8 pb-16 md:pb-24">
        {/* Header */}
        <CollectionHeader collection={collection} />
        
        {/* Products */}
        {products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <CollectionEmptyState />
        )}
      </div>
    </Layout>
  );
}

function CollectionHeader({ collection }: { collection: typeof collections[0] }) {
  const { t, language } = useLanguage();
  
  return (
    <div className="mb-12 md:mb-16">
      <span className="text-t-micro text-rrc-wine tracking-[0.25em] block mb-3">
        {t.collections.collection}
      </span>
      <h1 className="font-display text-3xl md:text-4xl font-medium uppercase tracking-wide text-rrc-white mb-4">
        {collectionNames[collection.id]?.[language] || collection.name}
      </h1>
      <p className="text-rrc-off text-sm md:text-base max-w-2xl">
        {collectionDescriptions[collection.id]?.[language] || collection.description}
      </p>
    </div>
  );
}

function CollectionEmptyState() {
  const { t } = useLanguage();

  return (
    <div className="text-center py-20">
      <p className="text-rrc-off mb-6">
        {t.shop.noProducts}
      </p>
      <a
        href="/shop"
        className="inline-flex items-center justify-center px-6 py-3 text-[11px] font-mono tracking-widest uppercase border border-rrc-line text-rrc-white hover:border-rrc-wine hover:text-rrc-wine transition-colors"
      >
        {t.shop.all}
      </a>
    </div>
  );
}
