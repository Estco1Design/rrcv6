'use client';
import Link from 'next/link';
import {useState,memo} from 'react';
import {motion,useReducedMotion} from 'framer-motion';
import {Heart} from 'lucide-react';
import type {Product} from '@/lib/schemas';
import {ProductImage} from '@/components/ui/ProductImage';
import {useLanguage} from '@/i18n';
import {categoryName,effectivePrice} from '@/lib/catalog-utils';
import {formatPrice,cn} from '@/lib/utils';
import {useFavoritesStore} from '@/store/favorites';
export const ProductCard=memo(function ProductCard({product,index=0,layoutClass}:{product:Product;index?:number;layoutClass?:string}){
 const {language}=useLanguage(),reduced=useReducedMotion();
 const [alternate,setAlternate]=useState(false),toggle=useFavoritesStore(s=>s.toggleFavorite),favorite=useFavoritesStore(s=>s.productIds.includes(product.id));
 const image=product.colors[0]?.images[0]||'/images/product-placeholder.svg',large=layoutClass?.includes('col-span-2');
 const price=effectivePrice(product);
 return <motion.article data-product-card="" className={cn('group relative',layoutClass)} initial={reduced?false:{opacity:0}} whileInView={{opacity:1}} viewport={{once:true,amount:.05}} transition={{duration:reduced?0:.32,delay:Math.min(index,3)*.03}}>
  <Link href={`/product/${product.slug}`} className="block" onMouseEnter={()=>{if(matchMedia('(hover:hover) and (pointer:fine)').matches)setAlternate(true)}} onMouseLeave={()=>setAlternate(false)}>
   <div className="relative aspect-[4/5] overflow-hidden bg-rrc-coal"><ProductImage src={alternate&&product.colors[0]?.images[1]?product.colors[0].images[1]:image} alt={product.name} sizes={large?'(max-width:768px) 92vw,48vw':'(max-width:768px) 44vw,24vw'}/></div>
   <div className="mt-4 space-y-1.5"><p className="font-mono text-[9px] text-rrc-off tracking-[.09em] uppercase">{categoryName(product.category,language)}</p><h3 className="font-mono text-[11px] sm:text-xs font-normal leading-relaxed text-rrc-white">{product.name}</h3><p className="text-[11px] text-rrc-silver">{price===null?(language==='ru'?'Цена по запросу':'Price on request'):formatPrice(price)}</p></div>
  </Link>
  <button type="button" onClick={()=>toggle(product.id)} aria-label={favorite?(language==='ru'?'Удалить из избранного':'Remove from wishlist'):(language==='ru'?'В избранное':'Add to wishlist')} aria-pressed={favorite} className="absolute top-1 right-1 flex min-h-11 min-w-11 items-center justify-center text-white/70 opacity-80 sm:opacity-0 group-hover:opacity-100 focus-visible:opacity-100"><Heart aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={1.3} fill={favorite?'currentColor':'none'}/></button>
 </motion.article>;
});
