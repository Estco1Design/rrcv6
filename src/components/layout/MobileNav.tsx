'use client';
import {useEffect,useRef,useState} from 'react';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {AnimatePresence,motion,useReducedMotion} from 'framer-motion';
import {useLanguage} from '@/i18n';
import {usePrivateSession} from '@/components/private/PrivateSessionProvider';
import {useCartStore} from '@/store/cart';
import {useFavoritesStore} from '@/store/favorites';
export function MobileNav(){
 const path=usePathname(),{language}=useLanguage(),ru=language==='ru',reduced=useReducedMotion();
 const {active}=usePrivateSession(),[open,setOpen]=useState(false),start=useRef<{x:number;y:number}|null>(null),dragged=useRef(false);
 const cart=useCartStore(s=>s.isOpen),favorites=useFavoritesStore(s=>s.isOpen),count=useCartStore(s=>s.items.reduce((n,item)=>n+item.quantity,0));
 useEffect(()=>setOpen(false),[path]);
 const swipeStart=(e:React.PointerEvent<HTMLElement>)=>{dragged.current=false;start.current={x:e.clientX,y:e.clientY};e.currentTarget.setPointerCapture(e.pointerId)};
 const swipeEnd=(e:React.PointerEvent<HTMLElement>)=>{if(!start.current)return;const dx=e.clientX-start.current.x,dy=e.clientY-start.current.y;start.current=null;if(Math.abs(dy)>30&&Math.abs(dy)>Math.abs(dx)){dragged.current=true;setOpen(dy<0)}};
 if(cart||favorites||path.startsWith('/admin'))return null;
 const items=[{href:'/shop',label:ru?'Каталог':'Shop'},{href:'/account',label:ru?'Кабинет':'Account'},{href:'/cart',label:(ru?'Корзина':'Bag')+(count?` (${count})`:'')},...(active?[{href:'/private/home',label:'PRIVATE ACCESS'}]:[])];
 return <div className="fixed bottom-0 inset-x-0 z-50 md:hidden pointer-events-none pb-[env(safe-area-inset-bottom)]" data-mobile-menu="">
  <AnimatePresence>{open&&<motion.nav id="mobile-navigation" aria-label={ru?'Основная навигация':'Main navigation'} initial={reduced?false:{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0,y:reduced?0:12}} transition={{duration:reduced?0:.24,ease:[.22,1,.36,1]}} className="pointer-events-auto mx-4 mb-3 border border-white/15 bg-black/95 backdrop-blur-xl px-6 py-4">
   <div className="flex flex-col">{items.map(item=><Link key={item.href} href={item.href} onClick={()=>setOpen(false)} aria-current={path===item.href?'page':undefined} className="flex min-h-12 items-center justify-between border-b border-white/[.07] last:border-0 text-[11px] tracking-[.12em] text-rrc-silver aria-[current=page]:text-white">{item.label}<span aria-hidden="true" className="text-white/35">↗</span></Link>)}</div>
  </motion.nav>}</AnimatePresence>
  <div className="mx-auto w-24 pointer-events-auto touch-none">
   <button type="button" onPointerDown={swipeStart} onPointerUp={swipeEnd} onPointerCancel={()=>{start.current=null}} aria-label={open?(ru?'Скрыть меню':'Hide menu'):(ru?'Открыть меню':'Open menu')} aria-expanded={open} aria-controls="mobile-navigation" onClick={()=>{if(dragged.current){dragged.current=false;return;}setOpen(value=>!value)}} className="flex min-h-12 w-full items-center justify-center bg-black/90 border-t border-x border-white/15 backdrop-blur-md"><span aria-hidden="true" className="relative block w-9 h-3"><span className={`absolute left-0 top-0 h-px bg-white/60 transition-transform duration-200 ${open?'w-9':'w-6'}`}/><span className={`absolute right-0 bottom-0 h-px bg-white/60 transition-transform duration-200 ${open?'w-6':'w-9'}`}/></span></button>
  </div>
 </div>;
}
