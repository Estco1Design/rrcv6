"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useLanguage } from "@/i18n";
import { privateSections } from "@/config/private-content";
export function PrivateHeader() {
  const { language } = useLanguage();
  const ru = language === "ru";
  const router = useRouter();
  const pathname = usePathname();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(false);
  return (
    <header
      data-rrc-private-header=""
      className="sticky top-0 z-50 border-b border-white/10 bg-black/95 backdrop-blur"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-8">
        <div className="min-h-16 flex items-center justify-between gap-4">
          <Link
            href="/private/home"
            className="text-[10px] sm:text-xs tracking-[.12em] uppercase"
          >
            RRC / {ru ? "Внутренний круг" : "Inner Circle"}
          </Link>
          <button
            disabled={busy}
            className="text-[10px] min-h-11 shrink-0 text-white/60 hover:text-white"
            onClick={async () => {
              setBusy(true);
              setError(false);
              try {
                const response = await fetch("/api/private-access/logout", {
                  method: "POST",
                });
                if (!response.ok) throw new Error();
                router.push("/");
                router.refresh();
              } catch {
                setError(true);
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? "…" : ru ? "Выйти" : "Exit"} ↗
          </button>
        </div>
        <nav
          aria-label={
            ru ? "Разделы Внутреннего круга" : "Inner Circle navigation"
          }
          className="flex gap-6 overflow-x-auto pb-2"
        >
          <Link
            href="/private/home"
            aria-current={pathname === "/private/home" ? "page" : undefined}
            className="min-h-10 inline-flex items-center shrink-0 text-[10px] uppercase text-white/60 aria-[current=page]:text-white"
          >
            {ru ? "Главная" : "Home"}
          </Link>
          {privateSections.map((section) => (
            <Link
              key={section.slug}
              href={`/private/${section.slug}`}
              aria-current={
                pathname === `/private/${section.slug}` ? "page" : undefined
              }
              className="min-h-10 inline-flex items-center shrink-0 text-[10px] uppercase text-white/60 aria-[current=page]:text-white"
            >
              {ru ? section.ru : section.en}
            </Link>
          ))}
        </nav>
        {error && (
          <p role="alert" className="text-xs py-2">
            {ru
              ? "Не удалось выйти. Повторите."
              : "Could not sign out. Try again."}
          </p>
        )}
      </div>
    </header>
  );
}
