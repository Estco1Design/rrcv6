// ============================================================
// RRC — вспомогательные данные сайта (коллекции, editorial layout).
// КАТАЛОГ ТОВАРОВ находится в едином источнике: @/lib/products.ts
// Старые тестовые товары (CROWN ZIPUP, EAGLE TEE и др.) полностью удалены.
// Реэкспортируем product-селекторы, чтобы существующие импорты не ломались.
// ============================================================

import { products, getCurrentCollectionPriority } from "@/lib/products";
import type { AudienceValue, Product } from "@/lib/schemas";

export {
  products as demoProducts,
  getAllProducts,
  getProductBySlug,
  getProductsByCategory,
  getProductsByCollection,
  getFeaturedProducts,
  searchProducts,
  getCurrentCollectionPriority,
} from "@/lib/products";

// ============================================================
// AUDIENCE (МУЖСКОЕ / ЖЕНСКОЕ) — архитектура фильтра по полу.
// Модель данных: audience: ['men'] | ['women'] | ['men','women'] (unisex).
// - МУЖСКОЕ показывает men + unisex;
// - ЖЕНСКОЕ показывает women + unisex;
// - ВСЕ показывает всё.
// Если у товара аудитория не задана ([]/undefined) — он считается
// доступным для всех, чтобы при включении фильтра ничего не исчезало.
// ============================================================
export type GenderFilter = "all" | "men" | "women";

export function matchesAudience(
  audience: AudienceValue[] | undefined,
  gender: GenderFilter
): boolean {
  if (gender === "all") return true;
  if (!audience || audience.length === 0) return true; // данных нет → показываем
  return audience.includes(gender);
}

// Тип секции магазина (CURRENT / OBJECTS / ARCHIVE)
export type ShopSection = "current" | "objects" | "archive";

// ============================================================
// ЕДИНЫЙ ЦЕНТРАЛИЗОВАННЫЙ ИСТОЧНИКА КАТЕГОРИЙ МАГАЗИНА.
// Категории строятся из shopCategories (@/lib/products.ts) —
// единственного реального источника категорий каталога.
// id === slug === значение поля Product.category ("outerwear" | "hoodies" | "tops" | "bottoms").
// name — EN-метка; labelRu — русская метка для отображения.
// Массив ВСЕГДА определён и непустой (гарантированный fallback),
// чтобы categories.find/filter/map/length никогда не падали с undefined.
// ============================================================
import { shopCategories } from "@/lib/products";

export interface ShopCategory {
  id: string;
  slug: string;
  name: string; // EN display label
  labelRu: string; // RU display label
}

const FALLBACK_SHOP_CATEGORIES: ShopCategory[] = [
  { id: "all", slug: "all", name: "ALL", labelRu: "ВСЕ ТОВАРЫ" },
  { id: "outerwear", slug: "outerwear", name: "OUTERWEAR", labelRu: "ВЕРХНЯЯ ОДЕЖДА" },
  { id: "hoodies", slug: "hoodies", name: "HOODIES", labelRu: "ХУДИ" },
  { id: "tops", slug: "tops", name: "TOPS", labelRu: "ВЕРХ" },
  { id: "bottoms", slug: "bottoms", name: "BOTTOMS", labelRu: "НИЗ" },
];

const RU_CATEGORY_LABELS: Record<string, string> = {
  all: "ВСЕ ТОВАРЫ",
  outerwear: "ВЕРХНЯЯ ОДЕЖДА",
  hoodies: "ХУДИ",
  tops: "ВЕРХ",
  bottoms: "НИЗ",
};

function buildShopCategories(): ShopCategory[] {
  const source = Array.isArray(shopCategories) && shopCategories.length > 0
    ? shopCategories
    : FALLBACK_SHOP_CATEGORIES;
  return source.map((c) => ({
    id: c.id,
    slug: c.id,
    name: c.name.toUpperCase(),
    labelRu: RU_CATEGORY_LABELS[c.id] ?? c.name.toUpperCase(),
  }));
}

export const categories: ShopCategory[] = (() => {
  const built = buildShopCategories();
  return built.length > 0 ? built : FALLBACK_SHOP_CATEGORIES;
})();

// Безопасный доступ к категориям (никогда не возвращает undefined)
export function getSafeCategories(): ShopCategory[] {
  return Array.isArray(categories) && categories.length > 0
    ? categories
    : FALLBACK_SHOP_CATEGORIES;
}

export function findCategory(slug: string | null | undefined): ShopCategory | undefined {
  if (!slug) return undefined;
  return getSafeCategories().find((c) => c.slug === slug);
}

// Коллекции (визуальные разделы сайта)
const COLLECTION_IMAGES = {
  "fall-2026": "/products/crest-leather-jacket-model.jpg",
  "spring-2026": "/products/leopard-waist-jeans-model.jpg",
  "archive": "/products/archive-hoodie-model.jpg",
};

const PLACEHOLDER_IMAGE = "/images/product-placeholder.svg";

function getCollectionImage(slug: string): string {
  return COLLECTION_IMAGES[slug as keyof typeof COLLECTION_IMAGES] || PLACEHOLDER_IMAGE;
}

export const collections = [
  {
    id: "fall-2026",
    name: "FALL/WINTER 2026",
    slug: "fall-2026",
    description: "Осенне-зимняя коллекция 2026. Тёмные тона, плотные ткани, архитектурные силуэты.",
    image: getCollectionImage("fall-2026"),
  },
  {
    id: "spring-2026",
    name: "SPRING/SUMMER 2026",
    slug: "spring-2026",
    description: "Весенне-летняя коллекция. Лёгкость, воздух, эксперименты с формой.",
    image: getCollectionImage("spring-2026"),
  },
  {
    id: "archive",
    name: "ARCHIVE",
    slug: "archive",
    description: "Предыдущие работы и модели RRC. Стоимость и возможность повторения — по запросу.",
    image: getCollectionImage("archive"),
  },
];

// Archive is a display status, independent of the original season or availability.
export function getProductsBySection(section: ShopSection): Product[] {
  const priority = getCurrentCollectionPriority();
  if (section === 'current') return products.filter(p => p.catalogStatus === 'current').sort((a,b) => priority.indexOf(a.slug)-priority.indexOf(b.slug));
  if (section === 'archive') return products.filter(p => p.catalogStatus === 'archive');
  // OBJECTS is a thematic view of the current construction-led pieces.
  return products.filter(p => p.catalogStatus === 'current' && (p.category === 'hoodies' || p.category === 'bottoms'));
}

// Editorial grid pattern для CURRENT
// Паттерн: 1 крупный / 2 товара / 1 крупный / 3 компактных / 2 товара → повтор
const editorialPattern = [
  "feature",
  "pair-left",
  "pair-right",
  "feature",
  "trio-left",
  "trio-middle",
  "trio-right",
  "pair-left",
  "pair-right",
];

export function getEditorialLayoutClass(index: number, section: ShopSection = "current"): string {
  if (section === "objects") {
    const objectsPattern = ["feature-wide", "feature", "feature-wide"];
    return objectsPattern[index % objectsPattern.length] === "feature-wide" ? "col-span-2 md:col-span-3" : "col-span-2";
  }

  if (section === "archive") {
    return "col-span-1";
  }

  switch (editorialPattern[index % editorialPattern.length]) {
    case "feature":
      return "col-span-2 md:col-span-2";
    case "feature-wide":
      return "col-span-2 md:col-span-3";
    default:
      return "col-span-1";
  }
}
