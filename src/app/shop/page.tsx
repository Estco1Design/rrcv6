"use client";

import {shopSectionImages} from '@/config/media';
import Layout from "@/components/layout/Layout";
import { getAllProducts, getProductsBySection, getEditorialLayoutClass, type ShopSection, categories, findCategory } from "@/lib/data";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useState, useEffect, useCallback, useMemo } from "react";
import { useLanguage } from "@/i18n";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ProductCard } from "@/components/product/ProductCard";
import { cn } from "@/lib/utils";
import { X, ChevronDown, SlidersHorizontal } from "lucide-react";
import {DialogFocus} from '@/components/ui/DialogFocus';
import { effectivePrice, colorName } from "@/lib/catalog-utils";
import { RemoveScroll } from 'react-remove-scroll';

// Abstract shapes for categories using clip-path
const categoryShapes = {
  current: "polygon(10% 0%, 90% 0%, 85% 100%, 5% 100%)",
  objects: "polygon(0% 10%, 100% 0%, 100% 90%, 0% 100%)",
  archive: "polygon(20% 0%, 80% 0%, 100% 50%, 80% 100%, 20% 100%, 0% 50%)",
};

const categoryImages = shopSectionImages;

type SortOption = 'recommended' | 'newest' | 'price-asc' | 'price-desc';

interface FilterState {
  section: ShopSection | null;
  category: string | null;
  size: string | null;
  color: string | null;
  availability: 'all' | 'available' | 'preorder' | 'sold-out' | null;
  priceMin: string | null;
  priceMax: string | null;
  sort: SortOption;
}

function ShopContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t, language } = useLanguage();
  
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filters = useMemo<FilterState>(() => {
    const section = searchParams.get('section');
    const category = searchParams.get('category');
    const availability = searchParams.get('availability');
    const sort = searchParams.get('sort');
    const price = (key: string) => { const value = searchParams.get(key); return value && Number.isFinite(Number(value)) && Number(value) >= 0 ? value : null; };
    return {
      section: ['current', 'objects', 'archive'].includes(section ?? '') ? section as ShopSection : null,
      category: categories.some(c => c.slug === category) ? category : null,
      size: searchParams.get('size'), color: searchParams.get('color'),
      availability: ['available', 'preorder', 'sold-out'].includes(availability ?? '') ? availability as FilterState['availability'] : null,
      priceMin: price('priceMin'), priceMax: price('priceMax'),
      sort: ['recommended', 'newest', 'price-asc', 'price-desc'].includes(sort ?? '') ? sort as SortOption : 'recommended',
    };
  }, [searchParams]);
  const viewMode = searchParams.size > 0 ? 'grid' : 'categories';
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsFilterOpen(false); };
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Определяем текущую секцию
  const currentSection: ShopSection = filters.section || 'current';
  
  // Получаем все продукты текущей секции для фильтрации
  const sectionProducts = useMemo(() => {
    return filters.section ? getProductsBySection(filters.section) : getAllProducts();
  }, [filters.section]);
  
  // Извлекаем уникальные значения для фильтров из продуктов секции
  const availableSizes = useMemo(() => {
    const sizes = new Set<string>();
    sectionProducts.forEach(p => {
      p.sizes?.forEach(s => sizes.add(s));
    });
    return Array.from(sizes).sort();
  }, [sectionProducts]);
  
  const availableColors = useMemo(() => {
    const colors = new Map<string, { name: string; hex: string }>();
    sectionProducts.forEach(p => {
      p.colors?.forEach(c => {
        if (!colors.has(c.name)) {
          colors.set(c.name, c);
        }
      });
    });
    return Array.from(colors.values());
  }, [sectionProducts]);
  
  const hasPrices = sectionProducts.some(p => effectivePrice(p) != null);
  const hasAvailability = sectionProducts.some(p => p.inStock != null || p.preorder);
  // Безопасный список категорий (никогда не undefined — единый источник @/lib/data)
  const safeCategories = Array.isArray(categories) && categories.length > 0 ? categories : [];
  const categoryLabel = (c: { name: string; labelRu?: string }) =>
    language === 'ru' ? (c.labelRu ?? c.name) : c.name;

  // Фильтрация продуктов
  const filteredProducts = useMemo(() => {
    let result = [...sectionProducts];

    // Filter by category (единая схема: Product.category === slug, /shop?category=<slug>)
    if (filters.category && filters.category !== 'all') {
      result = result.filter(p => p.category === filters.category);
    }
    
    // Filter by size
    if (filters.size) {
      result = result.filter(p => p.sizes?.some(s => s === filters.size));
    }
    
    // Filter by color
    if (filters.color) {
      result = result.filter(p => p.colors?.some(c => c.name === filters.color));
    }
    
    // Filter by availability
    if (filters.availability === 'available') {
      result = result.filter(p => p.inStock === true);
    } else if (filters.availability === 'preorder') {
      result = result.filter(p => p.preorder);
    } else if (filters.availability === 'sold-out') {
      result = result.filter(p => p.inStock === false && !p.preorder);
    }
    
    // Filter by price range
    if (filters.priceMin) {
      const min = parseFloat(filters.priceMin);
      result = result.filter(p => effectivePrice(p) != null && effectivePrice(p)! >= min);
    }
    if (filters.priceMax) {
      const max = parseFloat(filters.priceMax);
      result = result.filter(p => effectivePrice(p) != null && effectivePrice(p)! <= max);
    }
    
    // Sorting
    switch (filters.sort) {
      case 'newest':
        result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        break;
      case 'price-asc':
        result.sort((a, b) => (effectivePrice(a) ?? Infinity) - (effectivePrice(b) ?? Infinity));
        break;
      case 'price-desc':
        result.sort((a, b) => (effectivePrice(b) ?? -Infinity) - (effectivePrice(a) ?? -Infinity));
        break;
      case 'recommended':
      default:
        // Preserve curated section order for recommended sorting.
        break;
    }
    
    return result;
  }, [sectionProducts, filters]);

  // Обновление URL с параметрами фильтров
  const updateFilters = useCallback((newFilters: Partial<FilterState>) => {
    const updated = { ...filters, ...newFilters };
    if (!updated.section && !updated.category) updated.section = currentSection;
    const params = new URLSearchParams();
    
    if (updated.section) params.set('section', updated.section);
    if (updated.category && updated.category !== 'all') params.set('category', updated.category);
    if (updated.size) params.set('size', updated.size);
    if (updated.color) params.set('color', updated.color);
    if (updated.availability && updated.availability !== 'all') params.set('availability', updated.availability);
    if (updated.priceMin) params.set('priceMin', updated.priceMin);
    if (updated.priceMax) params.set('priceMax', updated.priceMax);
    if (updated.sort && updated.sort !== 'recommended') params.set('sort', updated.sort);
    
    const queryString = params.toString();
    const newPath = queryString ? `/shop?${queryString}` : '/shop';
    
    router.replace(newPath, { scroll: false });
  }, [filters, router, currentSection]);

  const handleBackToCategories = () => {
    router.push('/shop');
  };

  // Get section title
  const getSectionTitle = (section: ShopSection) => {
    if (language === 'ru') {
      switch (section) {
        case 'current': return 'ТЕКУЩАЯ КОЛЛЕКЦИЯ';
        case 'objects': return 'ОБЪЕКТЫ';
        case 'archive': return 'АРХИВ';
      }
    } else {
      switch (section) {
        case 'current': return 'CURRENT';
        case 'objects': return 'OBJECTS';
        case 'archive': return 'ARCHIVE';
      }
    }
  };

  // Clear all filters
  const clearAllFilters = () => {
    updateFilters({
      category: null,
      size: null,
      color: null,
      availability: null,
      priceMin: null,
      priceMax: null,
      sort: 'recommended',
    });
  };

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.category && filters.category !== 'all') count++;
    if (filters.size) count++;
    if (filters.color) count++;
    if (filters.availability && filters.availability !== 'all') count++;
    if (filters.priceMin || filters.priceMax) count++;
    return count;
  }, [filters]);

  return (
    <div className="min-h-screen bg-rrc-black">
      {/* Categories View */}
      {viewMode === 'categories' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="pt-24 md:pt-32 px-4 md:px-8 pb-16"
        >
          {/* Header */}
          <div className="mb-16 md:mb-24">
            <h1 className="font-display text-2xl md:text-3xl font-light tracking-wide text-rrc-white mb-3">
              {t.navigation.shop}
            </h1>
            <p className="text-rrc-off text-xs md:text-sm max-w-lg">
              {language === 'ru' 
                ? 'Архитектурные силуэты. Премиальные материалы.'
                : 'Architectural silhouettes. Premium materials.'
              }
            </p>
          </div>

          {/* Three Large Category Sections */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 max-w-7xl mx-auto">
            {/* CURRENT COLLECTION */}
            <Link href="/shop?section=current" className="group relative">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="relative aspect-[3/4] md:aspect-[2/3] overflow-hidden bg-rrc-coal"
                style={{ clipPath: categoryShapes.current }}
              >
                <div className="absolute inset-0 z-[1] bg-gradient-to-b from-transparent via-rrc-black/20 to-rrc-black/80" />
                <Image
                  src={categoryImages.current}
                  alt={language === 'ru' ? 'ТЕКУЩАЯ КОЛЛЕКЦИЯ' : 'CURRENT'}
                  fill
                  className="object-cover opacity-85 transition-opacity duration-300 group-hover:opacity-100"
                  sizes="(max-width: 768px) 92vw, 30vw" quality={72}
                />
                <div className="absolute inset-0 z-[2] flex items-center justify-center">
                  <div className="text-center">
                    <h2 className="font-mono text-lg md:text-xl font-light tracking-[0.2em] text-rrc-white uppercase mb-2">
                      {language === 'ru' ? 'ТЕКУЩАЯ КОЛЛЕКЦИЯ' : 'CURRENT'}
                    </h2>
                    <div className="w-8 h-[1px] bg-rrc-line mx-auto" />
                  </div>
                </div>
              </motion.div>
            </Link>

            {/* OBJECTS */}
            <Link href="/shop?section=objects" className="group relative">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="relative aspect-[3/4] md:aspect-[2/3] overflow-hidden bg-rrc-coal"
                style={{ clipPath: categoryShapes.objects }}
              >
                <div className="absolute inset-0 z-[1] bg-gradient-to-b from-transparent via-rrc-black/20 to-rrc-black/80" />
                <Image
                  src={categoryImages.objects}
                  alt="Objects"
                  fill
                  className="object-cover opacity-85 transition-opacity duration-300 group-hover:opacity-100"
                  sizes="(max-width: 768px) 92vw, 30vw" quality={72}
                />
                <div className="absolute inset-0 z-[2] flex items-center justify-center">
                  <div className="text-center">
                    <h2 className="font-mono text-lg md:text-xl font-light tracking-[0.2em] text-rrc-white uppercase mb-2">
                      {t.shop.objects}
                    </h2>
                    <div className="w-8 h-[1px] bg-rrc-line mx-auto" />
                  </div>
                </div>
              </motion.div>
            </Link>

            {/* ARCHIVE */}
            <Link href="/shop?section=archive" className="group relative">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="relative aspect-[3/4] md:aspect-[2/3] overflow-hidden bg-rrc-coal"
                style={{ clipPath: categoryShapes.archive }}
              >
                <div className="absolute inset-0 z-[1] bg-gradient-to-b from-transparent via-rrc-black/20 to-rrc-black/80" />
                <Image
                  src={categoryImages.archive}
                  alt="Archive"
                  fill
                  className="object-cover opacity-85 transition-opacity duration-300 group-hover:opacity-100"
                  sizes="(max-width: 768px) 92vw, 30vw" quality={72}
                />
                <div className="absolute inset-0 z-[2] flex items-center justify-center">
                  <div className="text-center">
                    <h2 className="font-mono text-lg md:text-xl font-light tracking-[0.2em] text-rrc-white uppercase mb-2">
                      {t.shop.archive}
                    </h2>
                    <div className="w-8 h-[1px] bg-rrc-line mx-auto" />
                  </div>
                </div>
              </motion.div>
            </Link>
          </div>
        </motion.div>
      )}

      {/* Grid View */}
      {viewMode === 'grid' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="pt-20 md:pt-24 px-4 md:px-8 pb-16 md:pb-24"
        >
          {/* Header with back button */}
          <div className="mb-8 md:mb-12">
            <button
              onClick={handleBackToCategories}
              className="flex items-center gap-3 text-t-ui tracking-widest text-rrc-off hover:text-rrc-white transition-colors mb-6"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
              </svg>
              {language === 'ru' ? 'НАЗАД К РАЗДЕЛАМ' : 'BACK TO CATEGORIES'}
            </button>
            
            <h1 className="font-display text-2xl md:text-3xl font-light tracking-wide text-rrc-white mb-4">
              {getSectionTitle(currentSection)}
            </h1>
          </div>

          {/* Filter Bar - минимальная строка над grid */}
          <div className="mb-8 md:mb-12 border-t border-rrc-line pt-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Left: PRODUCTS / ФИЛЬТРЫ / СОРТИРОВКА */}
              <div className="flex items-center gap-4 md:gap-6">
                <span className="font-mono text-xs tracking-widest text-rrc-silver uppercase">
                  {language === 'ru' ? 'ПРОДУКТЫ' : 'PRODUCTS'}
                </span>
                
                {/* Filter Button */}
                <button
                  onClick={() => setIsFilterOpen(true)}
                  className="flex items-center gap-2 text-t-ui tracking-widest text-rrc-off hover:text-rrc-white transition-colors md:hidden"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  {language === 'ru' ? 'ФИЛЬТРЫ' : 'FILTERS'}
                  {activeFilterCount > 0 && (
                    <span className="w-5 h-5 rounded-full bg-rrc-wine text-rrc-white text-[10px] flex items-center justify-center">
                      {activeFilterCount}
                    </span>
                  )}
                </button>
                
                {/* Desktop Filters Inline */}
                <div className="hidden md:flex items-center gap-3">
                  {/* Category Filter */}
                  <div className="relative group">
                    <select
                      value={filters.category || 'all'}
                      onChange={(e) => updateFilters({ category: e.target.value === 'all' ? null : e.target.value })}
                      className="appearance-none bg-transparent text-t-ui tracking-widest text-rrc-off hover:text-rrc-white cursor-pointer pr-6 py-1 focus:outline-none"
                    >
                      <option value="all">{language === 'ru' ? 'КАТЕГОРИЯ' : 'CATEGORY'}</option>
                      {safeCategories.filter(c => c.id !== 'all').map(cat => (
                        <option key={cat.id} value={cat.slug} className="bg-rrc-black text-rrc-white">
                          {categoryLabel(cat)}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-rrc-off pointer-events-none" />
                  </div>
                  
                  {/* Sort Dropdown */}
                  <div className="relative group">
                    <select
                      value={filters.sort}
                      onChange={(e) => updateFilters({ sort: e.target.value as SortOption })}
                      className="appearance-none bg-transparent text-t-ui tracking-widest text-rrc-off hover:text-rrc-white cursor-pointer pr-6 py-1 focus:outline-none"
                    >
                      <option value="recommended" className="bg-rrc-black text-rrc-white">
                        {language === 'ru' ? 'РЕКОМЕНДУЕМЫЕ' : 'RECOMMENDED'}
                      </option>
                      <option value="newest" className="bg-rrc-black text-rrc-white">
                        {language === 'ru' ? 'НОВИНКИ' : 'NEWEST'}
                      </option>
                      <option disabled={!hasPrices} value="price-asc" className="bg-rrc-black text-rrc-white">
                        {language === 'ru' ? 'ЦЕНА: ПО ВОЗРАСТАНИЮ' : 'PRICE: LOW TO HIGH'}
                      </option>
                      <option disabled={!hasPrices} value="price-desc" className="bg-rrc-black text-rrc-white">
                        {language === 'ru' ? 'ЦЕНА: ПО УБЫВАНИЮ' : 'PRICE: HIGH TO LOW'}
                      </option>
                    </select>
                    <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-rrc-off pointer-events-none" />
                  </div>
                </div>
              </div>
              
              {/* Right: Active filters summary + Clear */}
              <div className="flex items-center gap-4">
                {/* Active Filters Pills - Desktop */}
                <div className="hidden md:flex items-center gap-2 flex-wrap">
                  {filters.category && filters.category !== 'all' && (
                    <button
                      onClick={() => updateFilters({ category: null })}
                      className="flex items-center gap-1 px-3 py-1 bg-rrc-panel text-rrc-silver text-xs tracking-widest hover:bg-rrc-coal transition-colors"
                    >
                      {findCategory(filters.category) ? categoryLabel(findCategory(filters.category)!) : (filters.category ?? '')}
                      <X className="w-3 h-3" />
                    </button>
                  )}
                  {filters.size && (
                    <button
                      onClick={() => updateFilters({ size: null })}
                      className="flex items-center gap-1 px-3 py-1 bg-rrc-panel text-rrc-silver text-xs tracking-widest hover:bg-rrc-coal transition-colors"
                    >
                      {language === 'ru' ? 'РАЗМЕР' : 'SIZE'} {filters.size}
                      <X className="w-3 h-3" />
                    </button>
                  )}
                  {filters.color && (
                    <button
                      onClick={() => updateFilters({ color: null })}
                      className="flex items-center gap-1 px-3 py-1 bg-rrc-panel text-rrc-silver text-xs tracking-widest hover:bg-rrc-coal transition-colors"
                    >
                      {filters.color.toUpperCase()}
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
                
                {/* Results count */}
                <span className="font-mono text-xs text-rrc-off">
                  {filteredProducts.length} {language === 'ru' ? 'товаров' : 'items'}
                </span>
                
                {/* Clear All */}
                {activeFilterCount > 0 && (
                  <button
                    onClick={clearAllFilters}
                    className="text-t-micro text-rrc-off hover:text-rrc-white transition-colors underline decoration-rrc-line"
                  >
                    {language === 'ru' ? 'СБРОСИТЬ ВСЁ' : 'CLEAR ALL'}
                  </button>
                )}
              </div>
            </div>
            
            {/* Desktop additional filters row */}
            <div className="hidden md:flex items-center gap-6 mt-4 pt-4 border-t border-rrc-line/50">
              {/* Size Filter */}
              <div className="relative">
                <select
                  aria-label={language === 'ru' ? 'Размер' : 'Size'}
                  disabled={availableSizes.length === 0}
                  value={filters.size || ''}
                  onChange={(e) => updateFilters({ size: e.target.value || null })}
                  className="appearance-none bg-transparent text-t-micro tracking-widest text-rrc-off hover:text-rrc-white cursor-pointer pr-6 py-1 focus:outline-none"
                >
                  <option value="">{language === 'ru' ? 'РАЗМЕР' : 'SIZE'}</option>
                  {availableSizes.map(size => (
                    <option key={size} value={size} className="bg-rrc-black text-rrc-white">
                      {size}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 text-rrc-off pointer-events-none" />
              </div>
              
              {/* Color Filter */}
              <div className="relative">
                <select
                  value={filters.color || ''}
                  onChange={(e) => updateFilters({ color: e.target.value || null })}
                  className="appearance-none bg-transparent text-t-micro tracking-widest text-rrc-off hover:text-rrc-white cursor-pointer pr-6 py-1 focus:outline-none"
                >
                  <option value="">{language === 'ru' ? 'ЦВЕТ' : 'COLOR'}</option>
                  {availableColors.map(color => (
                    <option key={color.name} value={color.name} className="bg-rrc-black text-rrc-white">
                      {colorName(color.name, language)}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 text-rrc-off pointer-events-none" />
              </div>
              
              {/* Availability Filter */}
              <div className="relative">
                <select
                  aria-label={language === 'ru' ? 'Наличие' : 'Availability'}
                  disabled={!hasAvailability}
                  value={filters.availability || 'all'}
                  onChange={(e) => updateFilters({ availability: e.target.value as FilterState['availability'] || null })}
                  className="appearance-none bg-transparent text-t-micro tracking-widest text-rrc-off hover:text-rrc-white cursor-pointer pr-6 py-1 focus:outline-none"
                >
                  <option value="all" className="bg-rrc-black text-rrc-white">
                    {language === 'ru' ? 'НАЛИЧИЕ' : 'AVAILABILITY'}
                  </option>
                  <option value="available" className="bg-rrc-black text-rrc-white">
                    {language === 'ru' ? 'В НАЛИЧИИ' : 'IN STOCK'}
                  </option>
                  <option value="preorder" className="bg-rrc-black text-rrc-white">
                    {language === 'ru' ? 'ПРЕДЗАКАЗ' : 'PRE-ORDER'}
                  </option>
                  <option value="sold-out" className="bg-rrc-black text-rrc-white">
                    {language === 'ru' ? 'РАСПРОДАНО' : 'SOLD OUT'}
                  </option>
                </select>
                <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 text-rrc-off pointer-events-none" />
              </div>
              
              {/* Price Range */}
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  disabled={!hasPrices}
                  placeholder={language === 'ru' ? 'МИН' : 'MIN'}
                  value={filters.priceMin || ''}
                  onChange={(e) => updateFilters({ priceMin: e.target.value || null })}
                  className="w-20 bg-transparent border border-rrc-line text-t-micro tracking-widest text-rrc-white px-2 py-1 focus:outline-none focus:border-rrc-silver"
                />
                <span className="text-rrc-off">-</span>
                <input
                  type="number"
                  min="0"
                  disabled={!hasPrices}
                  placeholder={language === 'ru' ? 'МАКС' : 'MAX'}
                  value={filters.priceMax || ''}
                  onChange={(e) => updateFilters({ priceMax: e.target.value || null })}
                  className="w-20 bg-transparent border border-rrc-line text-t-micro tracking-widest text-rrc-white px-2 py-1 focus:outline-none focus:border-rrc-silver"
                />
              </div>
            </div>
          </div>

          {/* Products Grid - Editorial layout with varied positions */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6 auto-rows-auto">
            {filteredProducts.map((product, index) => {
              const layoutClass = getEditorialLayoutClass(index, currentSection);
              return (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  index={index}
                  layoutClass={layoutClass}
                />
              );
            })}
          </div>
          
          {filteredProducts.length === 0 && (
            <div className="text-center py-24">
              <p className="text-rrc-off text-sm mb-4">
                {language === 'ru' 
                  ? 'По выбранным фильтрам ничего не найдено' 
                  : 'No products match your filters'
                }
              </p>
              <button
                onClick={clearAllFilters}
                className="text-t-ui tracking-widest text-rrc-white hover:text-rrc-silver transition-colors"
              >
                {language === 'ru' ? 'СБРОСИТЬ ФИЛЬТРЫ' : 'CLEAR FILTERS'}
              </button>
            </div>
          )}
        </motion.div>
      )}

      {/* Mobile Filter Bottom Sheet */}
      <AnimatePresence>
        {isFilterOpen && (
          <>
            {/* Backdrop - only behind panel, not full screen dark */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFilterOpen(false)}
              className="fixed inset-0 bg-black/60 z-[60] md:hidden"
            />
            
            {/* Bottom Sheet with RemoveScroll for proper scroll lock */}
            <RemoveScroll>
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                role="dialog" aria-modal="true" aria-label={language === 'ru' ? 'Фильтры' : 'Filters'}
                className="fixed bottom-0 left-0 right-0 bg-[#0a0a0a] border-t border-rrc-line z-[61] md:hidden max-h-[85vh] flex flex-col"
              >
                <DialogFocus/>
                {/* Handle */}
                <div className="w-12 h-1 bg-rrc-line mx-auto mt-4 mb-4 rounded-full flex-shrink-0" />
                
                {/* Header */}
                <div className="flex items-center justify-between px-6 pb-4 flex-shrink-0 border-b border-rrc-line">
                  <h2 className="font-display text-lg text-[#f0f0f0] tracking-wide">
                    {language === 'ru' ? 'ФИЛЬТРЫ' : 'FILTERS'}
                  </h2>
                  <button
                    onClick={() => setIsFilterOpen(false)}
                    aria-label={t.common.close}
                    className="p-2 text-[#a0a0a0] hover:text-[#f0f0f0]"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto px-6 py-4">
                  <div className="space-y-6">
                  {/* Category */}
                  <div>
                    <label className="block text-t-micro tracking-widest text-rrc-silver uppercase mb-3">
                      {language === 'ru' ? 'КАТЕГОРИЯ' : 'CATEGORY'}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => updateFilters({ category: null })}
                        className={cn(
                          "px-4 py-2 text-xs tracking-widest border transition-colors",
                          !filters.category || filters.category === 'all'
                            ? "border-rrc-white text-rrc-white bg-rrc-white/10"
                            : "border-rrc-line text-rrc-off hover:border-rrc-silver"
                        )}
                      >
                        {language === 'ru' ? 'ВСЕ' : 'ALL'}
                      </button>
                      {safeCategories.filter(c => c.id !== 'all').map(cat => (
                        <button
                          key={cat.id}
                          onClick={() => updateFilters({ category: cat.slug })}
                          className={cn(
                            "px-4 py-2 text-xs tracking-widest border transition-colors",
                            filters.category === cat.slug
                              ? "border-rrc-white text-rrc-white bg-rrc-white/10"
                              : "border-rrc-line text-rrc-off hover:border-rrc-silver"
                          )}
                        >
                          {categoryLabel(cat)}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Size */}
                  <div>
                    <label className="block text-t-micro tracking-widest text-rrc-silver uppercase mb-3">
                      {language === 'ru' ? 'РАЗМЕР' : 'SIZE'}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => updateFilters({ size: null })}
                        className={cn(
                          "px-4 py-2 text-xs tracking-widest border transition-colors",
                          !filters.size
                            ? "border-rrc-white text-rrc-white bg-rrc-white/10"
                            : "border-rrc-line text-rrc-off hover:border-rrc-silver"
                        )}
                      >
                        {language === 'ru' ? 'ВСЕ' : 'ALL'}
                      </button>
                      {availableSizes.map(size => (
                        <button
                          key={size}
                          onClick={() => updateFilters({ size })}
                          className={cn(
                            "px-4 py-2 text-xs tracking-widest border transition-colors",
                            filters.size === size
                              ? "border-rrc-white text-rrc-white bg-rrc-white/10"
                              : "border-rrc-line text-rrc-off hover:border-rrc-silver"
                          )}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Color */}
                  <div>
                    <label className="block text-t-micro tracking-widest text-rrc-silver uppercase mb-3">
                      {language === 'ru' ? 'ЦВЕТ' : 'COLOR'}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => updateFilters({ color: null })}
                        className={cn(
                          "px-4 py-2 text-xs tracking-widest border transition-colors",
                          !filters.color
                            ? "border-rrc-white text-rrc-white bg-rrc-white/10"
                            : "border-rrc-line text-rrc-off hover:border-rrc-silver"
                        )}
                      >
                        {language === 'ru' ? 'ВСЕ' : 'ALL'}
                      </button>
                      {availableColors.map(color => (
                        <button
                          key={color.name}
                          onClick={() => updateFilters({ color: color.name })}
                          className={cn(
                            "px-4 py-2 text-xs tracking-widest border transition-colors flex items-center gap-2",
                            filters.color === color.name
                              ? "border-rrc-white text-rrc-white bg-rrc-white/10"
                              : "border-rrc-line text-rrc-off hover:border-rrc-silver"
                          )}
                        >
                          <span className="w-3 h-3 rounded-sm border border-rrc-line" style={{ backgroundColor: color.hex }} />
                          {colorName(color.name, language)}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Availability */}
                  <div>
                    <label className="block text-t-micro tracking-widest text-rrc-silver uppercase mb-3">
                      {language === 'ru' ? 'НАЛИЧИЕ' : 'AVAILABILITY'}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { value: 'all', label: language === 'ru' ? 'ВСЕ' : 'ALL' },
                        { value: 'available', label: language === 'ru' ? 'В НАЛИЧИИ' : 'IN STOCK' },
                        { value: 'preorder', label: language === 'ru' ? 'ПРЕДЗАКАЗ' : 'PRE-ORDER' },
                        { value: 'sold-out', label: language === 'ru' ? 'РАСПРОДАНО' : 'SOLD OUT' },
                      ].map(opt => (
                        <button
                          key={opt.value}
                          disabled={!hasAvailability && opt.value !== 'all'}
                          onClick={() => updateFilters({ availability: opt.value as FilterState['availability'] || null })}
                          className={cn(
                            "px-4 py-2 text-xs tracking-widest border transition-colors",
                            filters.availability === opt.value
                              ? "border-rrc-white text-rrc-white bg-rrc-white/10"
                              : "border-rrc-line text-rrc-off hover:border-rrc-silver"
                          )}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Price Range */}
                  <div>
                    <label className="block text-t-micro tracking-widest text-rrc-silver uppercase mb-3">
                      {language === 'ru' ? 'ЦЕНА' : 'PRICE'}
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                  min="0"
                  disabled={!hasPrices}
                        placeholder={language === 'ru' ? 'МИН' : 'MIN'}
                        value={filters.priceMin || ''}
                        onChange={(e) => updateFilters({ priceMin: e.target.value || null })}
                        className="min-w-0 flex-1 bg-rrc-panel border border-rrc-line text-rrc-white px-3 py-2 text-sm focus:outline-none focus:border-rrc-silver"
                      />
                      <span className="text-rrc-off">-</span>
                      <input
                        type="number"
                  min="0"
                  disabled={!hasPrices}
                        placeholder={language === 'ru' ? 'МАКС' : 'MAX'}
                        value={filters.priceMax || ''}
                        onChange={(e) => updateFilters({ priceMax: e.target.value || null })}
                        className="min-w-0 flex-1 bg-rrc-panel border border-rrc-line text-rrc-white px-3 py-2 text-sm focus:outline-none focus:border-rrc-silver"
                      />
                    </div>
                  </div>
                  
                  {/* Sort */}
                  <div>
                    <label className="block text-t-micro tracking-widest text-rrc-silver uppercase mb-3">
                      {language === 'ru' ? 'СОРТИРОВКА' : 'SORT BY'}
                    </label>
                    <div className="flex flex-col gap-2">
                      {[
                        { value: 'recommended', label: language === 'ru' ? 'РЕКОМЕНДУЕМЫЕ' : 'RECOMMENDED' },
                        { value: 'newest', label: language === 'ru' ? 'НОВИНКИ' : 'NEWEST' },
                        { value: 'price-asc', label: language === 'ru' ? 'ЦЕНА: ПО ВОЗРАСТАНИЮ' : 'PRICE: LOW TO HIGH' },
                        { value: 'price-desc', label: language === 'ru' ? 'ЦЕНА: ПО УБЫВАНИЮ' : 'PRICE: HIGH TO LOW' },
                      ].map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => updateFilters({ sort: opt.value as SortOption })}
                          className={cn(
                            "px-4 py-3 text-sm tracking-widest text-left border transition-colors",
                            filters.sort === opt.value
                              ? "border-rrc-white text-rrc-white bg-rrc-white/10"
                              : "border-rrc-line text-rrc-off hover:border-rrc-silver"
                          )}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Footer Actions */}
                <div className="mt-8 pt-6 border-t border-rrc-line flex items-center justify-between flex-shrink-0">
                  <button
                    onClick={clearAllFilters}
                    className="text-t-ui tracking-widest text-[#a0a0a0] hover:text-[#f0f0f0] transition-colors"
                  >
                    {language === 'ru' ? 'СБРОСИТЬ ВСЁ' : 'CLEAR ALL'}
                  </button>
                  <button
                    onClick={() => setIsFilterOpen(false)}
                    className="px-8 py-3 bg-rrc-white text-rrc-black text-sm tracking-widest font-medium hover:bg-rrc-silver transition-colors"
                  >
                    {language === 'ru' ? 'ПОКАЗАТЬ' : 'SHOW'} {filteredProducts.length} {language === 'ru' ? 'ТОВАРОВ' : 'ITEMS'}
                  </button>
                </div>
              </div>
            </motion.div>
            </RemoveScroll>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ShopPage() {
  return (
    <Layout>
      <Suspense fallback={<div className="text-rrc-off text-sm pt-24">Loading...</div>}>
        <ShopContent />
      </Suspense>
    </Layout>
  );
}
