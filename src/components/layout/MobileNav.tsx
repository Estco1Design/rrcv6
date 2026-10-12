"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, Grid2X2, Orbit, UserRound, ShoppingBag } from "lucide-react";
import { useLanguage } from "@/i18n";
import { useCartStore } from "@/store/cart";
import { useFavoritesStore } from "@/store/favorites";
export function MobileNav() {
  const pathname = usePathname(),
    { language } = useLanguage(),
    ru = language === "ru";
  const cartOpen = useCartStore((s) => s.isOpen),
    favoritesOpen = useFavoritesStore((s) => s.isOpen),
    count = useCartStore((s) =>
      s.items.reduce((n, item) => n + item.quantity, 0),
    );
  if (cartOpen || favoritesOpen || pathname?.startsWith("/admin")) return null;
  const links = [
    {
      href: "/",
      label: ru ? "Главная" : "Home",
      icon: House,
      active: pathname === "/",
    },
    {
      href: "/shop",
      label: ru ? "Каталог" : "Shop",
      icon: Grid2X2,
      active:
        pathname.startsWith("/shop") || pathname.startsWith("/collections"),
    },
    {
      href: "/access",
      label: ru ? "Круг" : "Circle",
      icon: Orbit,
      active: pathname === "/access",
    },
    {
      href: "/account",
      label: ru ? "Кабинет" : "Account",
      icon: UserRound,
      active: pathname === "/account",
    },
    {
      href: "/cart",
      label: ru ? "Корзина" : "Bag",
      icon: ShoppingBag,
      active: pathname === "/cart",
    },
  ];
  return (
    <nav
      aria-label={ru ? "Основная навигация" : "Main navigation"}
      className="fixed bottom-0 inset-x-0 z-50 md:hidden border-t border-white/10 bg-[#0a090c]/95 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]"
    >
      <div className="grid grid-cols-5">
        {links.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={item.active ? "page" : undefined}
            className={`relative flex min-h-[66px] min-w-0 flex-col items-center justify-center gap-1.5 px-1 text-[10px] ${item.active ? "text-rrc-white" : "text-rrc-off hover:text-rrc-white"}`}
          >
            {item.active && (
              <span
                aria-hidden="true"
                className="absolute top-0 h-[2px] w-7 bg-[#cfa8b3]"
              />
            )}
            <span className="relative">
              <item.icon
                className="h-[19px] w-[19px]"
                strokeWidth={1.35}
                aria-hidden="true"
              />
              {item.href === "/cart" && count > 0 && (
                <span className="absolute -right-2.5 -top-1.5 min-w-3.5 h-3.5 flex items-center justify-center rounded-full bg-rrc-wine text-white text-[8px]">
                  {count}
                </span>
              )}
            </span>
            <span>{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
