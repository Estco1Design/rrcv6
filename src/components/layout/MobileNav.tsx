"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/store/cart";
import { useFavoritesStore } from "@/store/favorites";

export function MobileNav() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  
  // Get overlay states from stores
  const isCartOpen = useCartStore((state) => state.isOpen);
  const isFavoritesOpen = useFavoritesStore((state) => state.isOpen);
  
  // Check if we're on a page that should hide the nav
  const isShopPage = pathname === "/shop" || pathname?.startsWith("/shop/") || pathname?.startsWith("/collections/");
  const isHomePage = pathname === "/";
  const isCartPage = pathname === "/cart" || pathname === "/favorites";
  
  // Determine active states
  const activeRRC = isHomePage;
  const activeSHOP = isShopPage;
  const activeBAG = isCartPage;

  useEffect(() => {
    const media=window.matchMedia('(max-width: 767px)');let frame=0;
    const handleScroll=()=>{if(frame || !media.matches)return;frame=requestAnimationFrame(()=>{const y=window.scrollY;setIsVisible(y<=100 || y<=lastScrollY.current);lastScrollY.current=y;frame=0;});};
    const sync=()=>{window.removeEventListener('scroll',handleScroll);if(media.matches)window.addEventListener('scroll',handleScroll,{passive:true});else setIsVisible(true);};
    sync();media.addEventListener('change',sync);
    return()=>{cancelAnimationFrame(frame);media.removeEventListener('change',sync);window.removeEventListener('scroll',handleScroll);};
  }, []);

  // Не показывать на определенных страницах или когда открыты оверлеи
  const hiddenPaths = ["/admin", "/login"];
  const shouldHide = hiddenPaths.some(path => pathname?.startsWith(path)) 
    || isCartOpen 
    || isFavoritesOpen;
    
  if (shouldHide) {
    return null;
  }

  // Показывать только на мобильных
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.nav
          className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          {/* Background с минимальной прозрачностью */}
          <div className="absolute inset-0 bg-rrc-black/95" />
          
          {/* Border сверху */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-rrc-line/30" />
          
          {/* Navigation items */}
          <div className="relative flex justify-around items-center h-14 px-4">
            <Link
              href="/shop"
              className={cn(
                "text-[10px] uppercase tracking-[0.2em] transition-colors duration-300",
                activeSHOP ? "text-rrc-white" : "text-rrc-off hover:text-rrc-silver"
              )}
            >
              SHOP
            </Link>
            
            <Link
              href="/"
              className={cn(
                "text-[10px] uppercase tracking-[0.2em] transition-colors duration-300",
                activeRRC ? "text-rrc-white" : "text-rrc-off hover:text-rrc-silver"
              )}
            >
              RRC
            </Link>
            
            <Link href="/account" className={cn("text-[10px] uppercase tracking-[0.2em] transition-colors", pathname === "/account" ? "text-rrc-white" : "text-rrc-off")}>PROFILE</Link>
            <Link
              href="/cart"
              className={cn(
                "text-[10px] uppercase tracking-[0.2em] transition-colors duration-300",
                activeBAG ? "text-rrc-white" : "text-rrc-off hover:text-rrc-silver"
              )}
            >
              BAG
            </Link>
          </div>
        </motion.nav>
      )}
    </AnimatePresence>
  );
}
