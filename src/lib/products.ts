// ============================================================
// RICH RUSSIAN COMMUNITY — реальный каталог (единый источник данных)
// 15 утверждённых позиций. Никаких тестовых/вымышленных товаров.
//
// Правила:
// - Размеры 1/2/3 — утверждённые владельцем обозначения для запроса; точные мерки пока не заданы.
// - Цена, остатки и состав указываются только по предоставленным данным.
//   Если данных нет — null / [] и UI скрывает блок, а не придумывает значение.
// - Цвета — variants одного товара (imagesByColor), а не отдельные товары.
// - Фотографии кладутся в /public/products/<slug>/ в согласованном порядке:
//   front, back, detail, model. Недостающие ракурсы просто не добавляются.
// ============================================================

import {preorderTerms} from "@/config/site";
import type { AudienceValue, Product } from "@/lib/schemas";

export type CatalogCategory = "outerwear" | "hoodies" | "tops" | "bottoms";

// Палитра RRC (нейтральные значения для swatch; не характеристика ткани)
const HEX = {
  black: "#0B0B0C",
  white: "#EDEAE4",
  ivory: "#EFE9DC",
  grey: "#8F8B8A",
  acidGreen: "#9DBE3F",
} as const;

// Префикс пути к изображениям товара
const P = (folder: string) => `/products/${folder}`;

// Хелпер: собирает массив существующих путей ракурсов для цвета
function views(folder: string, viewsList: string[] = ["front", "back", "detail", "model"]): string[] {
  return viewsList.map((v) => `${P(folder)}-${v}.jpg`);
}

interface RawProduct {
  id: string;
  slug: string;
  name: string;
  category: CatalogCategory;
  description: string | null;
  descriptionEn?: string;
  colors: { name: string; hex: string; images: string[] }[];
  sizes?: string[]; // [] если данных нет
  price?: number | null; // null если данных нет
  salePrice?: number | null;
  inStock?: boolean | null;
  preorder?: boolean; // null если данных нет
  featured?: boolean;
  featuredOrder?: number | null;
  collectionId?: string | null; // "fall-2026" | "spring-2026" | "archive" | null (данных нет)
  materials?: string | null;
  details?: string[];
  gender?: string | null;
  audience?: AudienceValue[]; // ['men'] | ['women'] | ['men','women'] (unisex); undefined = данных нет
}

// ============================================================
// Curated current selection. Changing this list does not erase archived products.
export const currentCollectionPriority = [
  "rrc-crest-leather-jacket",
  "rrc-high-waist-flared-leggings",
  "rrc-cropped-longsleeve",
  "rrc-asymmetric-zip-hoodie",
  "rrc-zip-volume-corduroy-pants",
];
export function getCurrentCollectionPriority(): string[] { return [...currentCollectionPriority]; }

// Все товары каталога временно unisex: ['men','women'],
// чтобы при включении фильтра МУЖСКОЕ / ЖЕНСКОЕ ничего случайно не исчезло.
// Распределение по аудитории уточняется отдельно и задаётся через rawProducts.audience.
const UNISEX: AudienceValue[] = ["men", "women"];

const rawProducts: RawProduct[] = [
  {
    id: "rrc-01",
    price: 15000,
    preorder: true,
    inStock: false,
    descriptionEn: "A fitted black faux leather jacket by RICH RUSSIAN COMMUNITY. Brand lettering on the chest and large RRC crest artwork on the back.",
    slug: "rrc-crest-leather-jacket",
    name: "RRC CREST LEATHER JACKET",
    category: "outerwear",
    description:
      "Чёрная приталенная куртка из экокожи RICH RUSSIAN COMMUNITY. На груди фирменная надпись RICH RUSSIAN COMMUNITY. На спине крупная графика RRC с гербом.",
    collectionId: "fall-2026",
    colors: [{ name: "Black", hex: HEX.black, images: views("crest-leather-jacket") }],
    featured: true,
    featuredOrder: 1,
  },
  {
    id: "rrc-02",
    price: 7000,
    preorder: true,
    inStock: false,
    descriptionEn: "A black oversized hoodie from the RICH RUSSIAN COMMUNITY archive. Layered RICH RUSSIAN COMMUNITY / MOSCOW artwork on the front. A relaxed silhouette.",
    slug: "rrc-archive-hoodie",
    name: "RRC ARCHIVE HOODIE",
    category: "hoodies",
    description:
      "Чёрное oversized худи RICH RUSSIAN COMMUNITY из архивной линейки. На передней части многослойная графика RICH RUSSIAN COMMUNITY / MOSCOW. Свободный силуэт.",
    collectionId: "archive",
    colors: [{ name: "Black", hex: HEX.black, images: views("archive-hoodie") }],
    sizes: ["ONE SIZE"],
    featured: true,
    featuredOrder: 2,
  },
  {
    id: "rrc-03",
    price: 8000,
    preorder: true,
    inStock: false,
    descriptionEn: "A cropped milk-coloured zip hoodie. The RRC crest on one side of the chest, brand lettering on the other. A relaxed unisex silhouette.",
    slug: "rrc-crest-cropped-zip-hoodie",
    name: "RRC CREST CROPPED ZIP HOODIE",
    category: "hoodies",
    description:
      "Укороченная zip hoodie молочного оттенка. На одной стороне груди фирменный герб RRC, на другой — надпись RICH RUSSIAN COMMUNITY. Свободный unisex силуэт.",
    collectionId: "fall-2026",
    colors: [{ name: "Ivory / Milk", hex: HEX.ivory, images: views("crest-cropped-zip") }],
    gender: "Unisex",
    featured: true,
    featuredOrder: 3,
  },
  {
    id: "rrc-04",
    price: 3000,
    preorder: true,
    inStock: false,
    descriptionEn: "High-waisted leggings with a pronounced flare from the knee. A fitted upper section and a long flared silhouette.",
    slug: "rrc-high-waist-flared-leggings",
    name: "RRC HIGH WAIST FLARED LEGGINGS",
    category: "bottoms",
    description:
      "Леггинсы с высокой посадкой и выраженным расширением от колена книзу. Облегающий верх и длинный расклешённый силуэт.",
    collectionId: "spring-2026",
    colors: [
      { name: "Acid Green", hex: HEX.acidGreen, images: views("flared-leggings-acid-green") },
      { name: "Black", hex: HEX.black, images: views("flared-leggings-black") },
    ],
    featured: true,
    featuredOrder: 5,
  },
  {
    id: "rrc-05",
    price: 2500,
    preorder: true,
    inStock: false,
    descriptionEn: "A fitted white cropped long-sleeve top with extended sleeves and a small RRC mark on the chest.",
    slug: "rrc-cropped-longsleeve",
    name: "RRC CROPPED LONGSLEEVE",
    category: "tops",
    description:
      "Белый укороченный лонгслив RRC. Облегающий силуэт. Удлиненные рукава. Небольшой фирменный знак RRC на груди.",
    collectionId: "spring-2026",
    colors: [{ name: "White", hex: HEX.white, images: views("cropped-longsleeve") }],
  },
  {
    id: "rrc-06",
    price: 9000,
    preorder: true,
    inStock: false,
    descriptionEn: "Relaxed RRC jeans with a contrasting leopard panel at the waist. The upper panel creates a visually doubled waistline.",
    slug: "rrc-leopard-waist-jeans",
    name: "RRC LEOPARD WAIST JEANS",
    category: "bottoms",
    description:
      "Свободные джинсы RRC с контрастной леопардовой вставкой в верхней части. Основная часть выполнена из денима. Леопардовая деталь формирует визуально двойную линию талии.",
    collectionId: "spring-2026",
    colors: [{ name: "Blue / Beige Leopard", hex: "#7C6A52", images: views("leopard-waist-jeans") }],
    featured: true,
    featuredOrder: 4,
  },
  {
    id: "rrc-07",
    price: 6000,
    preorder: true,
    inStock: false,
    descriptionEn: "A black RRC hoodie with large legislative text artwork on the back. A typographic statement.",
    slug: "rrc-code-hoodie",
    name: "RRC CODE HOODIE",
    category: "hoodies",
    description:
      "Чёрное худи RRC. На спине крупный текстовый принт со статьями законодательства. Графика построена как типографический statement.",
    collectionId: "fall-2026",
    colors: [{ name: "Black", hex: HEX.black, images: views("code-hoodie") }],
  },
  {
    id: "rrc-08",
    price: 10000,
    preorder: true,
    inStock: false,
    descriptionEn: "A black RRC hoodie with a graphic element and a contrasting red accent.",
    slug: "rrc-impact-hoodie",
    name: "RRC IMPACT HOODIE",
    category: "hoodies",
    description: "Чёрное худи RRC с графическим элементом и контрастным красным акцентом.",
    collectionId: "fall-2026",
    colors: [{ name: "Black", hex: HEX.black, images: views("impact-hoodie") }],
  },
  {
    id: "rrc-09",
    price: 8000,
    preorder: true,
    inStock: false,
    descriptionEn: "A black RICH RUSSIAN COMMUNITY hoodie with МЭЗ artwork on the back.",
    slug: "rrc-mez-hoodie",
    name: "RRC МЭЗ HOODIE",
    category: "hoodies",
    description: "Чёрное худи RICH RUSSIAN COMMUNITY. На спине расположена графика МЭЗ.",
    collectionId: "fall-2026",
    colors: [{ name: "Black", hex: HEX.black, images: views("mez-hoodie") }],
  },
  {
    id: "rrc-11",
    price: 12000,
    preorder: true,
    inStock: false,
    descriptionEn: "A black designer zip hoodie built around zips on the front, back and hood. The hood zip can close fully to change its shape.",
    slug: "rrc-asymmetric-zip-hoodie",
    name: "RRC ASYMMETRIC ZIP HOODIE",
    category: "hoodies",
    description:
      "Чёрная дизайнерская zip hoodie. Конструкция построена на системе молний: спереди, сзади и на капюшоне. Молния на капюшоне позволяет полностью закрывать его и менять форму изделия.",
    collectionId: "fall-2026",
    colors: [{ name: "Black", hex: HEX.black, images: views("asymmetric-zip") }],
    featured: true,
    featuredOrder: 6,
  },
  {
    id: "rrc-12",
    price: 11000,
    preorder: true,
    inStock: false,
    descriptionEn: "A grey zip hoodie with extended sleeves and elongated cuffs. Additional functional details on the sleeves.",
    slug: "rrc-extended-sleeve-zip-hoodie",
    name: "RRC EXTENDED SLEEVE ZIP HOODIE",
    category: "hoodies",
    description:
      "Zip hoodie с удлинённой конструкцией рукавов. Манжеты и нижняя часть рукавов имеют выраженный удлинённый силуэт. В конструкции используются дополнительные функциональные детали на рукавах.",
    collectionId: "fall-2026",
    colors: [{ name: "Grey", hex: HEX.grey, images: views("extended-sleeve-zip") }],
  },
  {
    id: "rrc-13",
    price: 5000,
    preorder: true,
    inStock: false,
    descriptionEn: "A T-shirt with zips along the side seams to change its shape and the degree of opening.",
    slug: "rrc-side-zip-tee",
    name: "RRC SIDE ZIP TEE",
    category: "tops",
    description:
      "Футболка RRC с молниями по боковым швам. Молнии позволяют изменять форму и степень раскрытия изделия.",
    collectionId: "spring-2026",
    colors: [
      { name: "White", hex: HEX.white, images: views("side-zip-tee-white") },
      { name: "Black", hex: HEX.black, images: [] },
    ],
  },
  {
    id: "rrc-14",
    price: 4000,
    preorder: true,
    inStock: false,
    descriptionEn: "A white RRC polo with RICH RUSSIAN COMMUNITY lettering on the collar.",
    slug: "rrc-script-collar-polo",
    name: "RRC SCRIPT COLLAR POLO",
    category: "tops",
    description:
      "Белое поло RRC. Главная графическая деталь находится на воротнике: RICH RUSSIAN COMMUNITY.",
    collectionId: "spring-2026",
    colors: [{ name: "White", hex: HEX.white, images: views("script-collar-polo") }],
  },
  {
    id: "rrc-15",
    price: 12000,
    preorder: true,
    inStock: false,
    descriptionEn: "Black corduroy trousers with functional side zips. Opening and closing the zips changes the volume and silhouette.",
    slug: "rrc-zip-volume-corduroy-pants",
    name: "RRC ZIP VOLUME CORDUROY PANTS",
    category: "bottoms",
    description:
      "Чёрные брюки из вельвета. По бокам проходят функциональные молнии. Открытие и закрытие молний позволяет изменять объём и силуэт брюк: от более узкого до расширенного.",
    collectionId: "fall-2026",
    colors: [{ name: "Black", hex: HEX.black, images: views("zip-volume-corduroy-pants") }],
  },
  {
    id: "rrc-16",
    price: 8000,
    preorder: true,
    inStock: false,
    descriptionEn: "White basic RRC trousers with a clean, minimal silhouette.",
    slug: "rrc-basic-white-pants",
    name: "RRC BASIC WHITE PANTS",
    category: "bottoms",
    description: "Белые базовые брюки RRC с чистым минималистичным силуэтом.",
    collectionId: "spring-2026",
    colors: [{ name: "White", hex: HEX.white, images: views("basic-white-pants") }],
  },
];

// Даты нужны для сортировки NEWEST. Это технические метаданные порядка,
// а не характеристики товара: порядок = порядковый номер утверждённого списка.
const baseDate = new Date("2026-01-01");

const catalogProducts: Product[] = rawProducts.map((raw, i) => {
  const createdAt = new Date(baseDate.getTime() + i * 86_400_000);
  return {
    id: raw.id,
    slug: raw.slug,
    name: raw.name,
    description: raw.description ? raw.description + (raw.preorder ? `\n\n${preorderTerms('ru')}` : "") : null,
    descriptionEn: raw.descriptionEn ? raw.descriptionEn + (raw.preorder ? `\n\n${preorderTerms('en')}` : "") : null,
    price: raw.price ?? null,
    salePrice: raw.salePrice ?? null,
    category: raw.category,
    imagesByColor: Object.fromEntries(raw.colors.map((c) => [c.name, c.images])),
    colors: raw.colors,
    images: raw.colors[0]?.images ?? [],
    sizes: raw.sizes ?? ['1', '2', '3'],
    inStock: raw.inStock ?? null,
    preorder: raw.preorder ?? false,
    // Временно все товары unisex (['men','women']) — см. комментарий UNISEX выше.
    audience: raw.audience ?? UNISEX,
    catalogStatus: currentCollectionPriority.includes(raw.slug) ? 'current' : 'archive',
    featured: currentCollectionPriority.includes(raw.slug),
    featuredOrder: currentCollectionPriority.includes(raw.slug) ? currentCollectionPriority.indexOf(raw.slug) : null,
    collectionId: raw.collectionId ?? null,
    materials: raw.materials ?? null,
    details: raw.details ?? [],
    gender: raw.gender ?? null,
    createdAt,
    updatedAt: createdAt,
  };
});

// Price worksheet uses stable product IDs after removal of model 10.
export function getPricingCatalog(): Product[] { return [...catalogProducts]; }
export const products: Product[] = catalogProducts.filter(p => p.catalogStatus !== 'hidden');

// ---------- Категории (реальный ассортимент) ----------
export const shopCategories: { id: "all" | CatalogCategory; name: string }[] = [
  { id: "all", name: "ALL" },
  { id: "outerwear", name: "OUTERWEAR" },
  { id: "hoodies", name: "HOODIES" },
  { id: "tops", name: "TOPS" },
  { id: "bottoms", name: "BOTTOMS" },
];

// ---------- Селекторы ----------

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export function getAllProducts(): Product[] {
  return products;
}

export function getProductsByCategory(categoryId: string): Product[] {
  if (!categoryId || categoryId === "all") return products;
  return products.filter((p) => p.category === categoryId);
}

export function getProductsByCollection(collectionId: string): Product[] {
  return products.filter((p) => collectionId === 'archive' ? p.catalogStatus === 'archive' : p.collectionId === collectionId);
}

// Featured для HOME: только товары с featured=true, по featuredOrder
export function getFeaturedProducts(limit?: number): Product[] {
  const list = products
    .filter((p) => p.featured && p.featuredOrder !== undefined)
    .sort((a, b) => (a.featuredOrder ?? 0) - (b.featuredOrder ?? 0));
  return typeof limit === "number" ? list.slice(0, limit) : list;
}

// Поиск по реальному каталогу: name, category, description, color
export function searchProducts(query: string): Product[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return products.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      (p.category ?? "").toLowerCase().includes(q) ||
      (p.description ?? "").toLowerCase().includes(q) ||
      (p.descriptionEn ?? "").toLowerCase().includes(q) ||
      p.colors.some((c) => c.name.toLowerCase().includes(q))
  );
}

// Значения фильтров строятся ТОЛЬКО из реальных данных каталога
export function getFilterColors(): { name: string; hex: string }[] {
  const map = new Map<string, { name: string; hex: string }>();
  products.forEach((p) =>
    p.colors.forEach((c) => {
      if (!map.has(c.name)) map.set(c.name, { name: c.name, hex: c.hex });
    })
  );
  return Array.from(map.values());
}

export function getFilterSizes(): string[] {
  const set = new Set<string>();
  products.forEach((p) => p.sizes.forEach((s) => set.add(s)));
  return Array.from(set).sort();
}

export function getPriceBounds(): { min: number | null; max: number | null } {
  const prices = products.map((p) => p.price).filter((x): x is number => x != null);
  if (prices.length === 0) return { min: null, max: null };
  return { min: Math.min(...prices), max: Math.max(...prices) };
}

// Совместимость со старыми импортами (демо-каталог удалён)
export const demoProducts = products;
