"use client";
import Link from "next/link";
import { useLanguage } from "@/i18n";
import { privateSections } from "@/config/private-content";
export function InnerCircleHome() {
  const { language } = useLanguage();
  const ru = language === "ru";
  return (
    <section className="max-w-6xl mx-auto px-5 sm:px-8 py-14 sm:py-24">
      <p className="text-[10px] tracking-[.3em] text-white/40 mb-6">
        RRC / INNER CIRCLE
      </p>
      <h1 className="font-display text-[clamp(30px,6vw,72px)] leading-tight">
        {ru ? "Внутренний круг" : "Inner Circle"}
      </h1>
      <p className="max-w-xl mt-7 text-sm leading-relaxed text-white/60">
        {ru
          ? "Ближе к процессу. Здесь собираем будущие релизы, отдельные дропы и разговор о вашей вещи — от первого силуэта до ухода за ней."
          : "Closer to the process. Future releases, separate drops and a conversation about your piece — from the first silhouette to its care."}
      </p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-12">
        {privateSections.map((s, i) => (
          <Link
            href={`/private/${s.slug}`}
            key={s.slug}
            className="group min-h-48 border border-white/15 p-6 hover:border-white/40 transition-colors"
          >
            <span className="text-[10px] text-white/35">
              0{i + 1} / INNER CIRCLE
            </span>
            <h2 className="font-display text-xl mt-7">{ru ? s.ru : s.en}</h2>
            <p className="mt-4 text-xs leading-relaxed text-white/50">
              {ru ? s.description : "Explore this part of the RRC process."}
            </p>
            <span className="block mt-5 text-white/60">↗</span>
          </Link>
        ))}
      </div>
      <div className="mt-12 border-t border-white/10 pt-6 text-xs leading-relaxed text-white/50">
        {ru
          ? "Кабинет и Внутренний круг независимы. Если хотите сохранить мерки и предпочтения, создайте профиль отдельно."
          : "Your account and Inner Circle are independent. Create a separate profile to save measurements and preferences."}{" "}
        <Link href="/account" className="underline text-white">
          {ru ? "Личный кабинет" : "Personal account"} ↗
        </Link>
      </div>
    </section>
  );
}
