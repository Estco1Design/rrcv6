'use client';
import Link from 'next/link';
import {useState,useRef,useEffect,memo} from 'react';
import {motion,useReducedMotion} from 'framer-motion';
import {Heart,Info,X} from 'lucide-react';
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
 const [brief,setBrief]=useState(false),timer=useRef<ReturnType<typeof setTimeout>>(),origin=useRef<{x:number;y:number}|null>(null),held=useRef(false);
 const cancelHold=()=>{clearTimeout(timer.current);origin.current=null;};
 useEffect(()=>()=>clearTimeout(timer.current),[]);
 useEffect(()=>{if(!brief)return;const close=(event:KeyboardEvent)=>{if(event.key==='Escape')setBrief(false)};window.addEventListener('keydown',close);return()=>window.removeEventListener('keydown',close)},[brief]);
 const description=(language==='en'?product.descriptionEn:product.description)||product.materials||product.details[0];
 return <motion.article data-product-card="" className={cn('group relative',layoutClass)} initial={reduced?false:{opacity:0}} whileInView={{opacity:1}} viewport={{once:true,amount:.05}} transition={{duration:reduced?0:.32,delay:Math.min(index,3)*.03}}>
  <Link href={`/product/${product.slug}`} className="block" onPointerDown={e=>{if(e.pointerType==='mouse'||!e.isPrimary)return;held.current=false;origin.current={x:e.clientX,y:e.clientY};timer.current=setTimeout(()=>{held.current=true;setBrief(true)},420)}} onPointerMove={e=>{if(origin.current&&Math.hypot(e.clientX-origin.current.x,e.clientY-origin.current.y)>10)cancelHold()}} onPointerUp={cancelHold} onPointerCancel={cancelHold} onLostPointerCapture={cancelHold} onContextMenu={e=>{if(held.current)e.preventDefault()}} onClick={e=>{if(held.current||brief){e.preventDefault();held.current=false;}}} onMouseEnter={()=>{if(matchMedia('(hover:hover) and (pointer:fine)').matches)setAlternate(true)}} onMouseLeave={()=>setAlternate(false)}>
   <div className="relative aspect-[4/5] overflow-hidden bg-rrc-coal"><ProductImage src={alternate&&product.colors[0]?.images[1]?product.colors[0].images[1]:image} alt={product.name} sizes={large?'(max-width:768px) 92vw,48vw':'(max-width:768px) 44vw,24vw'}/></div>
   <div className="mt-4 space-y-1.5"><p className="font-mono text-[9px] text-rrc-off tracking-[.09em] uppercase">{categoryName(product.category,language)}</p><h3 className="font-mono text-[11px] sm:text-xs font-normal leading-relaxed text-rrc-white">{product.name}</h3><p className="text-[11px] text-rrc-silver">{price===null?(language==='ru'?'Цена по запросу':'Price on request'):formatPrice(price)}</p></div>
  </Link>
  {brief&&<div data-product-brief="" className="absolute inset-x-0 top-0 aspect-[4/5] flex flex-col justify-end bg-black/70 backdrop-blur-sm p-5 text-white" role="region" aria-label={language==='ru'?'Краткая информация':'Quick details'}>
   <button type="button" onClick={()=>{setBrief(false);held.current=false}} aria-label={language==='ru'?'Закрыть информацию':'Close details'} className="absolute top-1 left-1 flex min-h-11 min-w-11 items-center justify-center"><X className="h-4 w-4"/></button>
   <p className="text-[9px] tracking-widest uppercase text-white/60">{categoryName(product.category,language)}</p><p className="mt-3 text-xs">{product.name}</p><p className="mt-2 text-[11px]">{price===null?(language==='ru'?'Цена по запросу':'Price on request'):formatPrice(price)}</p>{description&&<p className="mt-4 line-clamp-4 text-[10px] leading-relaxed text-white/75">{description}</p>}
   <Link href={`/product/${product.slug}`} className="mt-5 py-2 text-[9px] tracking-widest">{language==='ru'?'ПОДРОБНЕЕ':'VIEW DETAILS'} ↗</Link>
  </div>}
  {!brief&&<button type="button" onClick={()=>setBrief(true)} aria-label={language==='ru'?'Краткая информация':'Quick details'} className="absolute top-1 left-1 flex min-h-11 min-w-11 items-center justify-center text-white/65"><Info className="h-3.5 w-3.5" strokeWidth={1.3}/></button>}
  <button type="button" onClick={()=>toggle(product.id)} aria-label={favorite?(language==='ru'?'Удалить из избранного':'Remove from wishlist'):(language==='ru'?'В избранное':'Add to wishlist')} aria-pressed={favorite} className="absolute top-1 right-1 flex min-h-11 min-w-11 items-center justify-center text-white/70 opacity-80 sm:opacity-0 group-hover:opacity-100 focus-visible:opacity-100"><Heart aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={1.3} fill={favorite?'currentColor':'none'}/></button>
 </motion.article>;
});
