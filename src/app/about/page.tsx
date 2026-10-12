'use client';

import Layout from "@/components/layout/Layout";
import { useLanguage } from "@/i18n";
import Link from "next/link";

export default function AboutPage() {
  const { t } = useLanguage();

  return (
    <Layout>
      <div className="pt-20 md:pt-24 px-4 md:px-8 pb-16 md:pb-24">
        {/* Header */}
        <div className="mb-12 md:mb-16 text-center">
          <span className="text-t-micro text-rrc-wine tracking-[0.25em] block mb-4">
            {t.about.title === 'RICHRUSSIANCOMMUNITY' ? t.navigation.about : t.about.title.toUpperCase()}
          </span>
          <h1 className="font-display text-3xl md:text-4xl font-medium uppercase tracking-wide text-rrc-white mb-6">
            RICHRUSSIANCOMMUNITY
          </h1>
        </div>

        {/* Content - центрированная композиция */}
        <div className="max-w-3xl mx-auto space-y-8 md:space-y-12 text-center">
          <p className="text-rrc-off leading-relaxed text-base md:text-lg">
            {t.about.description}
          </p>

          <p className="text-rrc-off leading-relaxed text-base md:text-lg">
            {t.about.philosophy}
          </p>

          <div className="py-8 border-y border-rrc-line">
            <p className="font-display text-xl md:text-2xl font-medium uppercase tracking-wide text-rrc-white">
              {t.about.motto}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 pt-8">
            <div>
              <span className="text-t-ui tracking-widest text-rrc-wine block mb-2">
                {t.about.materials}
              </span>
              <p className="text-rrc-off text-sm leading-relaxed">
                {t.about.materialsDesc}
              </p>
            </div>
            <div>
              <span className="text-t-ui tracking-widest text-rrc-wine block mb-2">
                {t.about.production}
              </span>
              <p className="text-rrc-off text-sm leading-relaxed">
                {t.about.productionDesc}
              </p>
            </div>
          </div>

          <div className="pt-8">
            <Link href="/shop">
              <span className="inline-flex items-center justify-center px-6 py-3 text-[11px] font-mono tracking-widest uppercase bg-rrc-wine text-rrc-white hover:bg-rrc-bordeaux transition-colors cursor-pointer">
                {t.hero.viewCollection}
              </span>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
