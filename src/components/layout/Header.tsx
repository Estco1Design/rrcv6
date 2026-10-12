"use client";

import { motion } from "framer-motion";
import { ShoppingBag, Menu, Search, Heart } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { useCartStore } from "@/store/cart";
import { useFavoritesStore } from "@/store/favorites";
import { useLanguage } from "@/i18n";
import { cn } from "@/lib/utils";
import {usePrivateSession} from '@/components/private/PrivateSessionProvider';
import {DialogFocus} from '@/components/ui/DialogFocus';
import { siteConfig, telegramUrl, channelUrl } from '@/config/site';
import { RemoveScroll } from 'react-remove-scroll';
import { FavoritesDrawer } from "@/components/favorites/FavoritesDrawer";

interface NavItem {
  label: string;
  href: string;
}

export function Header() {
  const pathname = usePathname();
  const {active:privateActive}=usePrivateSession();
  const itemCount = useCartStore(state => state.items.reduce((sum, item) => sum + item.quantity, 0));
  const toggleCart = useCartStore((state) => state.toggleCart);
  const closeCart = useCartStore(state => state.closeCart);
  const closeFavorites = useFavoritesStore(state => state.closeFavorites);
  const toggleFavorites = useFavoritesStore((state) => state.toggleFavorites);
  const { language, setLanguage, t } = useLanguage();
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const navItems: NavItem[] = [
    { label: t.navigation.shop, href: "/shop" },
    { label: t.navigation.collections, href: "/collections" },
    { label: t.navigation.about, href: "/about" },
    { label: language === 'ru' ? 'ЛИЧНЫЙ КАБИНЕТ' : 'PERSONAL ACCOUNT', href: "/account" },
    ...(privateActive?[{label:'PRIVATE ACCESS',href:'/private/home'}]:[]),
  ];

  useEffect(() => {
    let frame=0;
    const handleScroll=()=>{if(frame)return;frame=requestAnimationFrame(()=>{setIsScrolled(window.scrollY>50);frame=0;});};
    handleScroll();window.addEventListener('scroll',handleScroll,{passive:true});
    return()=>{cancelAnimationFrame(frame);window.removeEventListener('scroll',handleScroll);};
  }, []);

  const previousPath = useRef(pathname);
  useEffect(() => {
    if (previousPath.current === pathname) return;
    previousPath.current = pathname;
    setIsMenuOpen(false); closeCart(); closeFavorites();
  }, [pathname, closeCart, closeFavorites]);
  useEffect(() => { const onKey = (e: KeyboardEvent) => {if (e.key === 'Escape') setIsMenuOpen(false);}; if (isMenuOpen) window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey);}, [isMenuOpen]);

  const isHomePage = pathname === "/";

  const handleLangToggle = () => {
    setLanguage(language === 'ru' ? 'en' : 'ru');
  };

  return (
    <>
      <motion.header
        className={cn(
          "fixed top-0 left-0 right-0 z-40 transition-colors duration-500",
          isHomePage && !isScrolled ? "bg-transparent" : "bg-rrc-black/95"
        )}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Symmetric flex layout: LEFT GROUP | CENTER LOGO | RIGHT GROUP.
            No absolute offsets for main elements — overlapping is impossible by structure. */}
        <div className="flex items-center justify-between gap-4 px-4 md:px-6 py-3 md:py-4">
          {/* LEFT GROUP */}
          <div className="flex shrink-0 flex-col items-start gap-2">
            {/* Top row: hamburger + search */}
            <div className="flex items-center gap-3 md:gap-5">
              <button
                onClick={() => {closeCart();closeFavorites();setIsMenuOpen(true);}}
                className="group -m-2 flex min-h-[44px] min-w-[44px] cursor-pointer items-center p-2 text-t-ui tracking-widest"
                aria-label={language === 'ru' ? 'Меню' : 'Menu'} aria-expanded={isMenuOpen}
              >
                <Menu className="w-4 h-4 text-rrc-white group-hover:text-rrc-silver transition-colors" />
              </button>

              <Link
                href="/search"
                className="group -m-2 flex min-h-[44px] min-w-[44px] cursor-pointer items-center p-2 text-t-ui tracking-widest"
                aria-label={language === 'ru' ? 'Поиск' : 'Search'}
              >
                <Search className="w-4 h-4 text-rrc-white group-hover:text-rrc-silver transition-colors" />
              </Link>
            </div>

            {/* Sub line: МАГАЗИН — separate clickable link ~20px below the icon row.
                Hidden on mobile (<md) so it never interferes with the compact top bar. */}
            <Link
              href="/shop"
              className="hidden md:inline-block cursor-pointer text-[10px] leading-none tracking-[0.2em] text-rrc-off hover:text-rrc-white transition-colors"
            >
              {t.navigation.shop}
            </Link>
          </div>

          {/* CENTER - Brand Logo (only ONE RRC wordmark).
              data-rrc-logo-target — цель полёта для RrcBootIntro (позиция
              измеряется через getBoundingClientRect, без hardcoded координат). */}
          <Link
            href="/"
            data-rrc-logo-target=""
            className="min-w-0 flex-1 cursor-pointer truncate text-center"
            aria-label="RICHRUSSIANCOMMUNITY — Home"
          >
            <span className={cn(
              "font-mono font-light tracking-[0.2em] text-rrc-white transition-all",
              "text-xs md:text-sm"
            )}>
              RRC
            </span>
          </Link>

          {/* RIGHT GROUP (mirrored) */}
          <div className="flex shrink-0 flex-col items-end gap-2">
            {/* Top row: RU/EN + wishlist + cart */}
            <div className="flex items-center justify-end gap-3 md:gap-5">
              <button
                onClick={handleLangToggle}
                className="-m-2 cursor-pointer p-2 text-t-ui tracking-widest text-rrc-white hover:text-rrc-silver transition-colors hidden md:block"
              >
                <span className={language === 'ru' ? 'opacity-100' : 'opacity-50'}>RU</span>
                <span className="mx-1 opacity-30">/</span>
                <span className={language === 'en' ? 'opacity-100' : 'opacity-50'}>EN</span>
              </button>

              <button
                onClick={() => {closeCart();toggleFavorites();}}
                className="group -m-2 flex min-h-[44px] min-w-[44px] cursor-pointer items-center p-2 text-t-ui tracking-widest"
                aria-label={language === 'ru' ? 'Избранное' : 'Wishlist'}
              >
                <Heart className="w-4 h-4 text-rrc-white group-hover:text-rrc-silver transition-colors" />
              </button>

              <button
                onClick={() => {closeFavorites();toggleCart();}}
                className="group relative -m-2 flex min-h-[44px] min-w-[44px] cursor-pointer items-center p-2 text-t-ui tracking-widest"
                aria-label={language === 'ru' ? 'Корзина' : 'Bag'}
              >
                <ShoppingBag className="w-4 h-4 text-rrc-white group-hover:text-rrc-silver transition-colors" />
                {itemCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 md:w-4 md:h-4 bg-rrc-wine text-rrc-white text-[9px] flex items-center justify-center rounded-none">
                    {itemCount}
                  </span>
                )}
              </button>
            </div>

            {/* Sub line: КОЛЛЕКЦИЯ — separate clickable link ~20px below the icon row.
                /collections is a real existing route (src/app/collections). Hidden on mobile. */}
            <Link
              href="/collections"
              className="hidden md:inline-block cursor-pointer text-[10px] leading-none tracking-[0.2em] text-rrc-off hover:text-rrc-white transition-colors"
            >
              {t.collections.collection}
            </Link>
          </div>
        </div>
      </motion.header>

      <FavoritesDrawer />

      {/* Mobile Fullscreen Menu - Simplified */}
      {isMenuOpen && (
        <RemoveScroll><motion.div role="dialog" aria-modal="true" aria-label={language === 'ru' ? 'Меню' : 'Menu'}
          className="fixed inset-0 z-[80] bg-rrc-black overflow-y-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          <DialogFocus/>
          <div className="flex flex-col min-h-full p-6 md:p-8 pt-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-12">
              <span className="text-t-ui tracking-widest text-rrc-off">{language === 'ru' ? 'МЕНЮ' : 'MENU'}</span>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-2 hover:bg-rrc-panel transition-colors"
                aria-label={t.common.close}
              >
                <svg className="w-5 h-5 text-rrc-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 flex flex-col justify-center gap-2">
              {navItems.map((item, index) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="font-display text-base md:text-lg font-light uppercase tracking-wide text-rrc-white hover:text-rrc-silver transition-colors py-3 border-b border-rrc-line-soft"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Footer Links */}
            <div className="flex flex-col gap-4 pt-8 border-t border-rrc-line-soft">
              <Link
                href="/delivery"
                onClick={() => setIsMenuOpen(false)}
                className="text-t-ui tracking-widest text-rrc-off hover:text-rrc-white transition-colors"
              >
                {t.navigation.delivery}
              </Link>
              <Link
                href="/contacts"
                onClick={() => setIsMenuOpen(false)}
                className="text-t-ui tracking-widest text-rrc-off hover:text-rrc-white transition-colors"
              >
                {t.navigation.contacts}
              </Link>
              <Link
                href="/privacy-policy"
                onClick={() => setIsMenuOpen(false)}
                className="text-t-ui tracking-widest text-rrc-off hover:text-rrc-white transition-colors"
              >
                {t.footer.privacyPolicy}
              </Link>
              <div className="flex gap-6 mt-2">
                {telegramUrl && <><a href={telegramUrl} target="_blank" rel="noopener noreferrer" className="text-t-ui tracking-widest text-rrc-off hover:text-rrc-white">{language === 'ru' ? 'ЗАКАЗЫ' : 'ORDERS'}</a><a href={channelUrl} target="_blank" rel="noopener noreferrer" className="text-t-ui text-rrc-off hover:text-rrc-white">{language === 'ru' ? 'КАНАЛ' : 'CHANNEL'}</a></>}
                {siteConfig.vk && <a href={siteConfig.vk} target="_blank" rel="noopener noreferrer" className="text-t-ui tracking-widest text-rrc-off hover:text-rrc-white">VK</a>}
              </div>
              <button
                onClick={() => {
                  handleLangToggle();
                  setIsMenuOpen(false);
                }}
                className="text-t-ui tracking-widest text-rrc-off hover:text-rrc-white transition-colors mt-2"
              >
                {language === 'ru' ? 'ЯЗЫК' : 'LANGUAGE'}: {language.toUpperCase()}
              </button>
            </div>
          </div>
        </motion.div></RemoveScroll>
      )}
    </>
  );
}
