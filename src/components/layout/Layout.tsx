"use client";

import { Header } from "@/components/layout/Header";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { MobileNav } from "@/components/layout/MobileNav";
import { RrcBootIntro } from "@/components/intro/RrcBootIntro";
import { useLanguage } from "@/i18n";
import Link from "next/link";
import { siteConfig, telegramUrl, channelUrl } from "@/config/site";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-rrc-black">
      <Header />
      {/* Intro монтируется ПОСЛЕ Header → target [data-rrc-logo-target] уже в DOM
          и измерим через getBoundingClientRect на первом же эффекте. */}
      <RrcBootIntro />
      <CartDrawer />
      <main id="main-content" className="pb-14 md:pb-0">{children}</main>
      <MobileNav />
      <Footer />
    </div>
  );
}

function Footer() {
  const { t, language } = useLanguage();

  return (
    <footer className="bg-rrc-coal border-t border-rrc-line mt-auto hidden md:block">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <h3 className="font-display text-xl font-bold uppercase tracking-wider text-rrc-white mb-4">
              RICHRUSSIANCOMMUNITY
            </h3>
            <p className="text-t-micro text-rrc-off max-w-md">
              {t.footer.digitalFashionHouse}. {t.footer.architecturalSilhouettes}. {t.footer.premiumMaterials}. {t.footer.attentionToDetail}.
            </p>
          </div>

          {/* Links - SHOP (единая схема категорий: /shop?category=<slug>) */}
          <div>
            <h4 className="text-t-ui tracking-widest text-rrc-white mb-4">{t.footer.shop}</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/shop" className="text-rrc-off hover:text-rrc-white transition-colors">{t.footer.allProducts}</Link></li>
              <li><Link href="/shop?category=outerwear" className="text-rrc-off hover:text-rrc-white transition-colors">{t.shop.outerwear}</Link></li>
              <li><Link href="/shop?category=hoodies" className="text-rrc-off hover:text-rrc-white transition-colors">{t.shop.hoodies}</Link></li>
              <li><Link href="/shop?category=tops" className="text-rrc-off hover:text-rrc-white transition-colors">{t.shop.tops}</Link></li>
              <li><Link href="/shop?category=bottoms" className="text-rrc-off hover:text-rrc-white transition-colors">{t.shop.bottoms}</Link></li>
            </ul>
          </div>

          {/* Links - INFO */}
          <div>
            <h4 className="text-t-ui tracking-widest text-rrc-white mb-4">{t.footer.information}</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/about" className="text-rrc-off hover:text-rrc-white transition-colors">{t.footer.about}</Link></li>
              <li><Link href="/delivery" className="text-rrc-off hover:text-rrc-white transition-colors">{t.navigation.delivery}</Link></li>
              <li><Link href="/contacts" className="text-rrc-off hover:text-rrc-white transition-colors">{t.navigation.contacts}</Link></li>
              <li><Link href="/privacy-policy" className="text-rrc-off hover:text-rrc-white transition-colors">{t.footer.privacyPolicy}</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-rrc-line mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-t-micro text-rrc-off">
            © 2026 RICHRUSSIANCOMMUNITY. {t.footer.allRightsReserved}.
          </p>
          <div className="flex flex-wrap justify-center gap-6">
            {telegramUrl && <><a href={telegramUrl} target="_blank" rel="noopener noreferrer" className="text-t-micro text-rrc-off hover:text-rrc-white transition-colors">{language === 'ru' ? 'ЗАКАЗЫ' : 'ORDERS'}</a><a href={channelUrl} target="_blank" rel="noopener noreferrer" className="text-t-micro text-rrc-off hover:text-rrc-white">{language === 'ru' ? 'КАНАЛ' : 'CHANNEL'}</a></>}
            {siteConfig.vk && <a href={siteConfig.vk} target="_blank" rel="noopener noreferrer" className="text-t-micro text-rrc-off hover:text-rrc-white transition-colors">VK</a>}
          </div>
        </div>
      </div>
    </footer>
  );
}
