"use client";

import { useState, useEffect } from "react";
import { searchProducts } from "@/lib/data";
import { ProductCard } from "@/components/product/ProductCard";
import type { Product } from "@/lib/schemas";
import Layout from "@/components/layout/Layout";
import {useLanguage} from "@/i18n";
import Link from "next/link";

export default function SearchPage() { return <Layout><SearchPageContent /></Layout>; }
function SearchPageContent() {
  const {language} = useLanguage(); const ru = language === "ru";
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim()) {
        setResults(searchProducts(query));
        setHasSearched(true);
      } else {
        setResults([]);
        setHasSearched(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="min-h-screen bg-rrc-black pt-24 px-4 md:px-8 pb-16">
      <div className="max-w-4xl mx-auto">
        {/* Search Input */}
        <div className="mb-12">
          <h1 className="font-display text-2xl md:text-3xl font-medium uppercase tracking-wide text-rrc-white mb-6">
            {ru ? 'ПОИСК' : 'SEARCH'}
          </h1>
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={ru ? 'Название или описание изделия…' : 'Item name or description…'} aria-label={ru ? 'Поиск изделий' : 'Search items'}
              className="w-full px-6 py-4 bg-rrc-coal border border-rrc-line text-rrc-white placeholder-rrc-muted focus:border-rrc-wine focus:outline-none text-base"
              autoFocus
            />
            {query && (
              <button
                onClick={() => {
                  setQuery("");
                  setResults([]);
                  setHasSearched(false);
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-rrc-off hover:text-rrc-white"
                aria-label={ru ? 'Очистить поиск' : 'Clear search'}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Results */}
        {!hasSearched && !query && (
          <div className="text-center py-20">
            <p className="text-rrc-off mb-6">{ru ? 'Введите запрос для поиска изделий' : 'Enter a search term'}</p>
          </div>
        )}

        {hasSearched && results.length === 0 && (
          <div className="text-center py-20">
            <p className="text-rrc-off mb-6">{ru ? 'Ничего не найдено по запросу' : 'No results for'} &quot;{query}&quot;</p>
            <Link
              href="/shop?section=current"
              className="inline-flex items-center justify-center px-6 py-3 text-[11px] font-mono tracking-widest uppercase border border-rrc-line text-rrc-white hover:border-rrc-wine hover:text-rrc-wine transition-colors"
            >
              {ru ? 'СМОТРЕТЬ ВСЕ ИЗДЕЛИЯ' : 'VIEW ALL ITEMS'}
            </Link>
          </div>
        )}

        {hasSearched && results.length > 0 && (
          <div>
            <p className="text-t-ui tracking-widest text-rrc-off mb-6">
              {ru ? 'НАЙДЕНО' : 'FOUND'}: {results.length}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {results.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
