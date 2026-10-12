"use client";

import { useState } from "react";
import Link from "next/link";
import { ProductGallery } from "@/components/product/ProductGallery";
import { Accordion } from "@/components/ui/Accordion";
import { Badge } from "@/components/ui/Badge";
import { ProductCard } from "@/components/product/ProductCard";
import { formatPrice } from "@/lib/utils";
import { useCartStore } from "@/store/cart";
import type { Product } from "@/lib/schemas";
import { Heart } from "lucide-react";
import { useFavoritesStore } from "@/store/favorites";
import { cn } from "@/lib/utils";
import { effectivePrice, categoryName, colorName } from "@/lib/catalog-utils";
import { motion } from "framer-motion";
import { useLanguage } from "@/i18n";

import {rrcSizeGuide} from '@/lib/sizing';
import {BodySizeGuide} from '@/components/product/BodySizeGuide';
import {PreorderFlag} from '@/components/product/PreorderFlag';

interface ProductPageProps {
  product: Product;
  relatedProducts: Product[];
}

export default function ProductPageClient({ product, relatedProducts }: ProductPageProps) {
  const { t, language } = useLanguage();
  const addItem = useCartStore((state) => state.addItem);
  const { toggleFavorite, isFavorite } = useFavoritesStore();

  // SOLD OUT — только если inStock реально задан как false (null = данных нет)
  const isSoldOut = product.inStock === false && !product.preorder;
  const [added, setAdded] = useState(false);
  const [sizeError, setSizeError] = useState(false);
  const [oversizeRequest, setOversizeRequest] = useState(false);
  const description = language === "en" ? product.descriptionEn ?? product.description : product.description;
  const hasDiscount = !!product.price && !!product.salePrice && product.salePrice < product.price;

  // ===== COLOR VARIANTS =====
  // selectedColor меняется -> основная фото и gallery берутся из imagesByColor[selectedColor]
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const selectedColor = product.colors[selectedColorIndex] ?? null;
  const colorImages = selectedColor?.images ?? product.images;
  // ===== SIZE =====
  // Показываем размеры только если они реально есть в данных товара
  const [selectedSize, setSelectedSize] = useState<string | null>(
    product.sizes.length === 1 ? product.sizes[0] : null
  );

  const handleAddToCart = () => {
    if (!selectedColor || isSoldOut) return;
    // Если размеров несколько и ни один не выбран — просим выбрать
    if (product.sizes.length > 1 && !selectedSize) {
      setSizeError(true);
      const el = document.getElementById("size-selector");
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    addItem({
      // canonical id товара из product data (rrc-01 и т.д.) — не генерируется заново
      id: product.id,
      productId: product.id,
      slug: product.slug,
      variantId: `${product.id}-${selectedColor.name}-${selectedSize ?? "default"}`,
      name: product.name,
      price: effectivePrice(product),
      image: colorImages[0] || "/images/product-placeholder.svg",
      size: selectedSize,
      fitRequest: oversizeRequest ? 'oversize' : 'regular',
      color: selectedColor.name,
      quantity: 1,
    });
    setAdded(true); setSizeError(false);
  };

  return (
    <div className="pt-24 md:pt-32 pb-16 md:pb-24 px-4 md:px-8">
        {/* Breadcrumbs */}
        <nav className="mb-8">
          <ol className="flex flex-wrap items-center gap-2 text-t-micro uppercase tracking-widest text-rrc-off">
            <li>
              <Link href="/" className="hover:text-rrc-white transition-colors">
                {t.navigation.home}
              </Link>
            </li>
            <li>/</li>
            <li>
              <Link href="/shop" className="hover:text-rrc-white transition-colors">
                {t.navigation.shop}
              </Link>
            </li>
            {product.category && (
              <>
                <li>/</li>
                <li>
                  <Link
                    href={`/shop?category=${categoryName(product.category, language)}`}
                    className="hover:text-rrc-white transition-colors uppercase"
                  >
                    {categoryName(product.category, language)}
                  </Link>
                </li>
              </>
            )}
            <li>/</li>
            <li className="text-rrc-silver">{product.name}</li>
          </ol>
        </nav>

        {/* Main Product Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 mb-16 md:mb-24">
          {/* Left: Gallery — крупная фотография на detail page */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <ProductGallery
              key={`${product.id}-${selectedColor?.name ?? ""}`}
              images={colorImages}
              altText={{ ru: [], en: [] }}
              productName={product.name}
            />
          </motion.div>

          {/* Right: Product Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="lg:sticky lg:top-32 self-start"
          >
            {/* Category */}
            {product.category && (
              <p className="font-mono text-xs uppercase tracking-widest text-rrc-off mb-2">
                {categoryName(product.category, language)}
              </p>
            )}

            {product.catalogStatus === 'archive' && <p className="text-t-micro uppercase tracking-widest text-rrc-silver mb-3">{language === 'ru' ? 'АРХИВ RRC · ВОЗМОЖНОСТЬ ПОВТОРЕНИЯ ПО ЗАПРОСУ' : 'RRC ARCHIVE · RECREATION ON ENQUIRY'}</p>}
            {/* Name */}
            <h1 className="font-display text-2xl md:text-3xl font-light tracking-wide text-rrc-white mb-4 uppercase">
              {product.name}
            </h1>

            {/* Price block — только если цена реально есть в данных */}
            {product.price != null ? (
              <div className="flex items-center gap-3 mb-6">
                {hasDiscount ? (
                  <>
                    <span className="text-2xl text-rrc-wine font-medium">{formatPrice(product.salePrice!)}</span>
                    <span className="text-lg text-rrc-off line-through">
                      {formatPrice(product.price)}
                    </span>
                    <Badge variant="sale">SALE</Badge>
                  </>
                ) : (
                  <span className="text-2xl text-rrc-white font-medium">{formatPrice(product.price)}</span>
                )}
              </div>
            ) : <p className="text-t-ui uppercase tracking-widest text-rrc-off mb-6">{language === 'ru' ? 'ЦЕНА ПО ЗАПРОСУ' : 'PRICE ON REQUEST'}</p>}

            {/* Status badges */}
            <div className="flex gap-2 mb-6">
              {isSoldOut && <Badge variant="sold-out">SOLD OUT</Badge>}
              {product.preorder && <PreorderFlag/>}
            </div>

            {/* Description */}
            {description && (
              <div className="prose prose-invert max-w-none mb-8">
                <p className="text-rrc-off leading-relaxed whitespace-pre-line">
                  {description}
                </p>
              </div>
            )}

            {/* Color Selector — swatch меняет фото и gallery без reload */}
            {product.colors.length > 0 && (
              <div className="mb-8">
                <label className="block text-t-ui uppercase tracking-widest text-rrc-silver mb-3">
                  {language === "ru" ? "ЦВЕТ" : "COLOR"}:{" "}
                  <span className="text-rrc-white">{selectedColor ? colorName(selectedColor.name, language) : ""}</span>
                </label>
                <div className="flex flex-wrap gap-3">
                  {product.colors.map((color, index) => {
                    const isActive = index === selectedColorIndex;
                    return (
                      <button
                        key={color.name}
                        onClick={() => {setSelectedColorIndex(index);setAdded(false);}}
                        aria-label={colorName(color.name, language)}
                        aria-pressed={isActive}
                        title={colorName(color.name, language)}
                        className={cn(
                          "relative w-11 h-11 rounded-full border-2 transition-all",
                          // визуально отмечаем выбранный цвет
                          isActive
                            ? "border-rrc-white ring-2 ring-rrc-white/30 scale-110"
                            : "border-transparent hover:border-rrc-line"
                        )}
                        style={{ backgroundColor: color.hex }}
                      >
                        {isActive && (
                          <span className="absolute inset-0 flex items-center justify-center">
                            <svg
                              className={cn(
                                "w-4 h-4",
                                ["#EDEAE4", "#EFE9DC", "#9DBE3F", "#8F8B8A", "#7C6A52"].includes(color.hex)
                                  ? "text-rrc-black"
                                  : "text-rrc-white"
                              )}
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={3}
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Size Selector — только если размеры реально указаны в данных */}
            {product.sizes.length > 0 && (
              <div id="size-selector" className="mb-8">
                <label className="block text-t-ui uppercase tracking-widest text-rrc-silver mb-3">
                  {language === "ru" ? "РАЗМЕР" : "SIZE"}
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => {setSelectedSize(size);setAdded(false);setSizeError(false);}}
                      aria-pressed={selectedSize === size}
                      className={cn(
                        "min-w-[52px] min-h-[44px] px-4 py-2.5 text-sm uppercase tracking-wider border transition-colors",
                        selectedSize === size
                          ? "border-rrc-white bg-rrc-white text-rrc-black"
                          : "border-rrc-line text-rrc-off hover:border-rrc-silver hover:text-rrc-white"
                      )}
                    >
                      {size}
                    </button>
                  ))}
                </div>
                {selectedSize && <div className="mt-3 border border-rrc-line bg-rrc-panel p-4 text-sm" role="status">
                  <div className="flex justify-between gap-4"><span>{language === 'ru' ? 'РАЗМЕР RRC' : 'RRC SIZE'}</span><span>{selectedSize}</span></div>
                  <div className="flex justify-between gap-4 mt-2"><span className="text-rrc-off">{language === 'ru' ? 'ОРИЕНТИР' : 'REFERENCE'}</span><span>{rrcSizeGuide[selectedSize] ?? selectedSize}</span></div>
                  <p className="text-xs text-rrc-off mt-3">{language === 'ru' ? 'Буквенный размер — ориентир. Точные мерки изделия и посадку подтвердим до оплаты. ONE SIZE не означает, что вещь подходит всем.' : 'Letter sizes are a reference. Garment measurements and fit will be confirmed before payment. ONE SIZE does not mean it fits everyone.'}</p>
                </div>}
                <label className="flex gap-3 mt-5 items-start text-sm text-rrc-off cursor-pointer"><input type="checkbox" checked={oversizeRequest} onChange={e=>{setOversizeRequest(e.target.checked);setAdded(false);}} className="mt-1 accent-rrc-wine"/>{language === 'ru' ? 'Хочу более свободную посадку' : 'I would like a looser fit'}</label>
                <p className="text-xs text-rrc-off mt-2">{language === 'ru' ? 'Это пожелание, а не отдельный размер. Возможность и параметры согласуем до оплаты.' : 'This is a fit request, not a separate size. Availability and measurements are agreed before payment.'}</p>
                <BodySizeGuide initialKind={product.audience.length===1 && product.audience[0]==='women'?'women':'men'}/>
              </div>
            )}

            {sizeError && <p role="alert" className="text-sm text-rrc-off mb-4">{language === 'ru' ? 'Выберите размер.' : 'Select a size.'}</p>}
            {product.sizes.length === 0 && <p className="text-sm text-rrc-off mb-6">{language === 'ru' ? 'Размер и посадку согласуем при запросе.' : 'We will confirm sizing and fit with your enquiry.'}</p>}
            {product.preorder && <p className="text-xs text-rrc-off mb-6">{language === 'ru' ? 'Изготовление по предзаказу до 14 рабочих дней. Срок доставки рассчитывается отдельно.' : 'Pre-order production takes up to 14 working days. Shipping time is additional.'}</p>}
            {product.inStock == null && <p className="text-xs text-rrc-off mb-6">{language === 'ru' ? 'Наличие и сроки изготовления уточняются.' : 'Availability and production time to be confirmed.'}</p>}
            {/* Actions */}
            <div className="space-y-3 mb-8">
              <button
                onClick={handleAddToCart}
                disabled={isSoldOut}
                className={cn(
                  "w-full py-4 text-t-ui tracking-widest uppercase transition-colors",
                  isSoldOut
                    ? "bg-rrc-panel text-rrc-off cursor-not-allowed"
                    : "bg-rrc-white text-rrc-black hover:bg-rrc-silver"
                )}
              >
                {isSoldOut
                  ? "SOLD OUT"
                  : added ? (language === 'ru' ? 'ДОБАВЛЕНО' : 'ADDED')
                  : product.preorder ? (language === 'ru' ? 'ДОБАВИТЬ ПРЕДЗАКАЗ' : 'ADD PRE-ORDER')
                  : product.price == null ? (language === 'ru' ? 'ДОБАВИТЬ В ЗАПРОС' : 'ADD TO ENQUIRY')
                  : language === 'ru' ? 'ДОБАВИТЬ В КОРЗИНУ' : 'ADD TO BAG'}
              </button>

              {added && <Link href="/cart" className="block text-center text-t-ui uppercase tracking-widest py-3" role="status">{language === 'ru' ? 'ПЕРЕЙТИ В КОРЗИНУ →' : 'OPEN BAG →'}</Link>}
              <button
                onClick={() => toggleFavorite(product.id)}
                className={cn(
                  "w-full py-4 border flex items-center justify-center gap-2 text-t-ui tracking-widest uppercase transition-colors",
                  isFavorite(product.id)
                    ? "border-rrc-wine text-rrc-wine"
                    : "border-rrc-line text-rrc-off hover:border-rrc-silver hover:text-rrc-white"
                )}
              >
                <Heart className={cn("w-4 h-4", isFavorite(product.id) && "fill-current")} />
                {isFavorite(product.id)
                  ? language === "ru"
                    ? "В ИЗБРАННОМ"
                    : "IN WISHLIST"
                  : language === "ru"
                    ? "В ИЗБРАННОЕ"
                    : "ADD TO WISHLIST"}
              </button>
            </div>

            {/* Details accordion — только реальные данные */}
            {(product.details.length > 0 || product.materials || product.gender) && (
              <Accordion
                items={[
                  ...(product.details.length > 0
                    ? [
                        {
                          id: "details",
                          title: language === "ru" ? "ДЕТАЛИ" : "DETAILS",
                          content: (
                            <ul className="space-y-2">
                              {product.details.map((detail, i) => (
                                <li key={i} className="text-rrc-off text-sm">
                                  {detail}
                                </li>
                              ))}
                            </ul>
                          ),
                        },
                      ]
                    : []),
                  ...(product.materials
                    ? [
                        {
                          id: "materials",
                          title: language === "ru" ? "МАТЕРИАЛ" : "MATERIALS",
                          content: <p className="text-rrc-off text-sm">{product.materials}</p>,
                        },
                      ]
                    : []),
                  ...(product.gender
                    ? [
                        {
                          id: "fit",
                          title: language === "ru" ? "ПОСАДКА" : "FIT",
                          content: <p className="text-rrc-off text-sm">{product.gender}</p>,
                        },
                      ]
                    : []),
                ]}
              />
            )}
          </motion.div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="border-t border-rrc-line pt-16">
            <h2 className="font-display text-xl md:text-2xl font-light tracking-wide text-rrc-white uppercase mb-8">
              {language === "ru" ? "СВЯЗАННЫЕ ТОВАРЫ" : "RELATED PRODUCTS"}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {relatedProducts.map((p, idx) => (
                <ProductCard key={p.id} product={p} index={idx} />
              ))}
            </div>
          </section>
        )}
    </div>
  );
}
