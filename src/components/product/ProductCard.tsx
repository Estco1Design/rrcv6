"use client";

import Link from "next/link";
import {productionPolicy} from "@/config/site";
import { formatPrice } from "@/lib/utils";
import type { Product } from "@/lib/schemas";
import { useLanguage } from '@/i18n';
import { categoryName, colorName } from '@/lib/catalog-utils';
import { Badge } from "@/components/ui/Badge";
import { ProductImage } from "@/components/ui/ProductImage";
import {PreorderFlag} from '@/components/product/PreorderFlag';
import { Heart } from "lucide-react";
import { useFavoritesStore } from "@/store/favorites";
import { cn } from "@/lib/utils";
import { useState, useRef, useEffect, memo } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

interface ProductCardProps {
  product: Product;
  index?: number;
  layoutClass?: string;
}

function ProductCardBody({ product, index, imageSizes }: { product: Product; index: number; imageSizes: string }) {
  const {language} = useLanguage();
  const toggleFavorite=useFavoritesStore(state=>state.toggleFavorite);
  const favorite=useFavoritesStore(state=>state.productIds.includes(product.id));
  const [showAlternate,setShowAlternate]=useState(false);
  const reduced=useReducedMotion();
  const [isHolding, setIsHolding] = useState(false);
  const holdTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // SOLD OUT показываем только если inStock реально задан (null = данных нет)
  const isSoldOut = product.inStock === false && !product.preorder;
  // SALE — только если salePrice реально задан и ниже цены
  const hasDiscount = !!product.price && !!product.salePrice && product.salePrice < product.price;

  // Hold to reveal for mobile
  const handleTouchStart = () => {
    holdTimeoutRef.current = setTimeout(() => {
      setIsHolding(true);
    }, 500);
  };

  const handleTouchEnd = () => {
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }
    setIsHolding(false);
  };

  useEffect(() => {
    return () => {
      if (holdTimeoutRef.current) clearTimeout(holdTimeoutRef.current);
    };
  }, []);

  return (
    <motion.div
      initial={reduced?false:{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }} viewport={{once:true,amount:0.05}}
      transition={{ duration: reduced?0:0.4, delay: Math.min(index,3) * 0.03 }}
      className="relative"
    >
      {product.catalogStatus === 'archive' && <span className="absolute top-12 left-3 z-20 bg-rrc-black/85 px-2 py-1 text-[9px] tracking-widest text-rrc-white">{language === 'ru' ? 'АРХИВ' : 'ARCHIVE'}</span>}
      {/* Quick view overlay - hold to reveal on mobile */}
      <AnimatePresence>
        {isHolding && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 z-30 bg-black/80 flex items-center justify-center md:hidden"
          >
            <div className="text-center space-y-2 px-6">
              <h3 className="text-rrc-white text-lg font-display tracking-wide">{product.name}</h3>
              {product.price != null && (
                <p className="text-rrc-wine text-xl">{formatPrice(product.price)}</p>
              )}
              {product.sizes.length > 0 && (
                <p className="text-rrc-off text-xs tracking-widest">{language === 'ru' ? 'РАЗМЕРЫ' : 'SIZES'}: {product.sizes.join(', ')}</p>
              )}
              <p className="text-rrc-off text-xs mt-4">
                {(language === 'ru' ? product.description : product.descriptionEn ?? product.description)?.slice(0, 80)}…
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Link
        href={`/product/${product.slug}`}
        className="block"
        onMouseEnter={()=>{if(window.matchMedia('(hover: hover) and (pointer: fine)').matches)setShowAlternate(true)}}
        onMouseLeave={()=>setShowAlternate(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        {/* Image container — основной ratio карточек 4:5, cover без деформации */}
        <div className="relative aspect-[4/5] overflow-hidden bg-rrc-coal">
          {/* Главное изображение */}
          <motion.div
            className="absolute inset-0"
            
          >
            <ProductImage
              src={product.colors[0]?.images[0] || "/images/product-placeholder.svg"}
              alt={product.name}
              sizes={imageSizes}
            />
          </motion.div>

          {/* Hover image (второе фото первого цвета), если есть.
              Лёгкий diagonal reveal + opacity, ~300ms. Без zoom/glitch/spin. */}
          {showAlternate && (product.colors[0]?.images.length ?? 0) > 1 && (
            <div className="absolute inset-0 hidden md:block">
              <ProductImage
                src={product.colors[0].images[1]}
                alt={`${product.name} — альтернативный ракурс`}
                sizes={imageSizes}
              />
            </div>
          )}

          {product.colors[0]?.images.length === 0 && <span className="absolute bottom-4 left-4 right-4 text-center text-t-micro uppercase text-rrc-off">{language === 'ru' ? 'ФОТО СКОРО' : 'PHOTO COMING SOON'}</span>}
          {/* Badges */}
          {product.preorder && <div className="absolute top-3 left-3 z-20 pointer-events-none"><PreorderFlag/></div>}
          <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
            {hasDiscount && <Badge variant="sale">SALE</Badge>}
            {isSoldOut && <Badge variant="sold-out">SOLD OUT</Badge>}
          </div>

          {/* Wishlist button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleFavorite(product.id);
            }}
            className={cn(
              "absolute top-3 right-3 z-10 p-2 transition-all duration-300",
              "opacity-100 md:opacity-0 group-hover:opacity-100 focus:opacity-100",
              favorite && "opacity-100"
            )}
            aria-label={favorite ? (language === 'ru' ? 'Удалить из избранного' : 'Remove from wishlist') : (language === 'ru' ? 'В избранное' : 'Add to wishlist')} aria-pressed={favorite}
          >
            <Heart
              className={cn(
                "w-4 h-4 transition-colors",
                favorite ? "fill-rrc-wine text-rrc-wine" : "text-rrc-white hover:text-rrc-silver"
              )}
            />
          </button>
        </div>

        {/* Info — второй слой глубины (чуть меньшее смещение, чем изображение) */}
        <motion.div className="mt-4 space-y-1" >
          <h3 className="font-mono text-[10px] md:text-[11px] uppercase tracking-wider text-rrc-off">
            {categoryName(product.category, language)}
          </h3>
          <h4 className="font-mono text-xs md:text-sm uppercase tracking-wide text-rrc-white group-hover:text-rrc-silver transition-colors line-clamp-2">
            {product.name}
          </h4>

          {/* Price block — только если цена реально есть в данных */}
          {product.price != null && (
            <div className="flex items-center gap-2">
              {hasDiscount ? (
                <>
                  <span className="text-rrc-wine font-bold">{formatPrice(product.salePrice!)}</span>
                  <span className="text-rrc-off text-sm line-through">
                    {formatPrice(product.price)}
                  </span>
                </>
              ) : (
                <span className={isSoldOut ? "text-rrc-off" : "text-rrc-white"}>
                  {formatPrice(product.price)}
                </span>
              )}
            </div>
          )}

          {product.preorder && <p className="text-[10px] uppercase tracking-widest text-rrc-silver">PRE-ORDER · {language === 'ru' ? `ДО ${productionPolicy.workingDays} РАБОЧИХ ДНЕЙ` : `UP TO ${productionPolicy.workingDays} WORKING DAYS`}</p>}
          {product.price == null && <p className="text-t-micro uppercase tracking-widest text-rrc-off">{language === 'ru' ? 'ЦЕНА ПО ЗАПРОСУ' : 'PRICE ON REQUEST'}</p>}

          {/* Цвета товара */}
          {product.colors.length > 0 && (
            <div className="flex gap-1 mt-2 items-center">
              {product.colors.slice(0, 3).map((color) => (
                <span
                  key={color.name}
                  className="w-3 h-3 rounded-none border border-rrc-line"
                  style={{ backgroundColor: color.hex }}
                  title={colorName(color.name, language)}
                />
              ))}
              {product.colors.length > 3 && (
                <span className="text-t-micro text-rrc-off">+{product.colors.length - 3}</span>
              )}
              <span className="text-t-micro text-rrc-off ml-1 truncate max-w-[10ch]">
                {colorName(product.colors[0].name, language)}
                {product.colors.length > 1 ? ` +${product.colors.length - 1}` : ""}
              </span>
            </div>
          )}
        </motion.div>
      </Link>
    </motion.div>
  );
}

export const ProductCard=memo(function ProductCard({product,index=0,layoutClass}:ProductCardProps){
 const large=layoutClass?.includes('col-span-2');
 const imageSizes=large?'(max-width: 768px) 92vw, 48vw':'(max-width: 768px) 44vw, 24vw';
 return <div className={cn("group relative",layoutClass)}><ProductCardBody product={product} index={index} imageSizes={imageSizes}/></div>;
});
