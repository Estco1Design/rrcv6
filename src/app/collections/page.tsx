"use client";

import Layout from "@/components/layout/Layout";
import { collections } from "@/lib/data";
import { ProductImage } from "@/components/ui/ProductImage";
import Link from "next/link";
import { useLanguage } from "@/i18n";

export default function CollectionsPage() {
  const { t, language } = useLanguage();
  
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

  const collectionNames: Record<string, Record<string, string>> = {
    "fall-2026": { ru: "ОСЕНЬ / ЗИМА 2026", en: "FALL / WINTER 2026" },
    "spring-2026": { ru: "ВЕСНА / ЛЕТО 2026", en: "SPRING / SUMMER 2026" },
    "archive": { ru: "АРХИВ", en: "ARCHIVE" }
  };
  
  return (
    <Layout>
      <div className="pt-20 md:pt-24 px-4 md:px-8 pb-16 md:pb-24">
        {/* Header */}
        <div className="mb-12 md:mb-16">
          <h1 className="font-display text-3xl md:text-4xl font-medium uppercase tracking-wide text-rrc-white mb-4">
            {t.collections.title}
          </h1>
          <p className="text-rrc-off text-sm md:text-base max-w-2xl">
            {t.collections.description}
          </p>
        </div>

        {/* Collections Grid */}
        <div className="space-y-12 md:space-y-16">
          {collections.map((collection, index) => (
            <article
              key={collection.id}
              className={`grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 ${
                index % 2 === 1 ? "md:flex-row-reverse" : ""
              }`}
            >
              {/* Image */}
              <Link href={`/collections/${collection.slug}`} className="group relative aspect-[4/3] md:aspect-square bg-rrc-panel overflow-hidden">
                <ProductImage
                  src={collection.image || "/images/product-placeholder.svg"}
                  alt={collectionNames[collection.id]?.[language] || collection.name}
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority={index===0}
                />
              </Link>

              {/* Content */}
              <div className="flex flex-col justify-center">
                <span className="text-t-micro text-rrc-wine tracking-[0.25em] block mb-4">
                  {t.collections.collection}
                </span>
                <Link href={`/collections/${collection.slug}`}>
                  <h2 className="font-display text-2xl md:text-3xl font-medium uppercase tracking-wide text-rrc-white mb-4 group-hover:text-rrc-silver transition-colors">
                    {collectionNames[collection.id]?.[language] || collection.name}
                  </h2>
                </Link>
                <p className="text-rrc-off text-sm leading-relaxed mb-6">
                  {collectionDescriptions[collection.id]?.[language] || collection.description}
                </p>
                <Link
                  href={`/collections/${collection.slug}`}
                  className="inline-flex items-center gap-2 text-t-ui tracking-widest text-rrc-white hover:text-rrc-wine transition-colors self-start"
                >
                  {t.collections.viewCollection}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </Layout>
  );
}
