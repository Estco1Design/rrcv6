"use client";
import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/i18n";
import { getAllProducts } from "@/lib/products";
import { telegramUrl, preorderTerms, contactHref } from "@/config/site";
import {
  privateSections,
  earlyAccessReleases,
  privateDropReleases,
  type PrivateSection,
} from "@/config/private-content";
export function PrivateSectionPage({ section }: { section: PrivateSection }) {
  const { language } = useLanguage();
  const ru = language === "ru";
  const info = privateSections.find((s) => s.slug === section)!;
  const products = getAllProducts().filter((p) =>
    section === "preorder"
      ? p.preorder
      : section === "archive"
        ? p.catalogStatus === "archive"
        : false,
  );
  const releases =
    section === "early-access" ? earlyAccessReleases : privateDropReleases;
  const message = ru
    ? `Здравствуйте, RRC! Хочу обсудить: ${info.ru}.`
    : `Hello RRC! I would like to discuss: ${info.en}.`;
  const href = telegramUrl
    ? `${telegramUrl}?text=${encodeURIComponent(message)}`
    : contactHref;
  return (
    <section className="max-w-6xl mx-auto px-5 sm:px-8 py-14 sm:py-20">
      <p className="text-[10px] tracking-[.3em] text-white/40 mb-5">
        PRIVATE ACCESS
      </p>
      <h1 className="font-display text-3xl sm:text-5xl">
        {ru ? info.ru : info.en}
      </h1>
      {(section === "early-access" || section === "private-drops") && (
        <>
          <p className="max-w-xl mt-6 text-sm leading-relaxed text-white/60">
            {ru
              ? section === "early-access"
                ? "Первый взгляд на будущие изделия: процесс, детали и фотографии из цеха."
                : "Отдельные выпуски для PRIVATE ACCESS. Состав и условия каждого дропа появятся вместе с его публикацией."
              : section === "early-access"
                ? "A first look at future pieces: the process, details and workshop photographs."
                : "Separate releases for PRIVATE ACCESS. Each publication will include its actual terms."}
          </p>
          {!releases.length ? (
            <div className="mt-10 border border-white/15 p-8 sm:p-12">
              <p className="text-[10px] tracking-widest text-white/40">
                {ru ? "ГОТОВИМ МАТЕРИАЛЫ" : "IN PREPARATION"}
              </p>
              <h2 className="font-display text-xl mt-5">
                {ru
                  ? "Фотографии ещё не опубликованы"
                  : "Photographs are not published yet"}
              </h2>
              <p className="text-sm max-w-xl leading-relaxed mt-4 text-white/50">
                {ru
                  ? "Добавим реальные кадры из цеха после съёмки и утверждения. Даты, наличие и условия сообщим вместе с релизом. Здесь будут только выпуски, подготовленные для PRIVATE ACCESS."
                  : "Real workshop photographs will be added after the shoot and approval. Dates, availability and terms will come with each release. This space is reserved for releases prepared for the circle."}
              </p>
            </div>
          ) : (
            <div className="mt-10 grid sm:grid-cols-2 gap-6">
              {releases.map((r) => (
                <article key={r.id} className="border border-white/15 p-5">
                  {r.images.map((src, i) => (
                    <div key={src} className="relative aspect-[3/4] mb-4">
                      <Image
                        unoptimized={src.startsWith("/api/private-media/")}
                        src={src}
                        alt={`${r.title} / ${i + 1}`}
                        fill
                        sizes="(max-width:640px) 100vw, 50vw"
                        className="object-cover"
                      />
                    </div>
                  ))}
                  <h2 className="font-display text-xl">{r.title}</h2>
                  <p className="text-sm mt-3 text-white/50">{r.description}</p>
                </article>
              ))}
            </div>
          )}
        </>
      )}
      {(section === "preorder" || section === "archive") && (
        <>
          <p className="mt-6 max-w-2xl text-sm leading-relaxed text-white/60">
            {section === "preorder"
              ? preorderTerms(ru ? "ru" : "en")
              : ru
                ? "Подборка ранее выпущенных изделий из открытого каталога. Возможность повторения, материал и стоимость уточняем у команды; архив не означает наличие на складе."
                : "Previously released pieces from the public catalogue. Ask the team about re-production, materials and price; archive does not imply stock."}
          </p>
          <p className="mt-4 text-[11px] text-white/40">
            {ru
              ? "Это существующий каталог RRC, а не эксклюзивный закрытый релиз."
              : "These are existing RRC catalogue pieces, not an exclusive private release."}
          </p>
          {products.length ? (
            <div className="mt-10 grid grid-cols-2 md:grid-cols-3 gap-5">
              {products.map((p) => (
                <Link key={p.id} href={`/product/${p.slug}`} className="group">
                  {p.images[0] && (
                    <div className="relative aspect-[3/4] bg-white/5">
                      <Image
                        src={p.images[0]}
                        alt={p.name}
                        fill
                        sizes="(max-width:768px) 50vw, 33vw"
                        className="object-cover"
                      />
                    </div>
                  )}
                  <h2 className="text-xs uppercase mt-4 leading-relaxed">
                    {p.name}
                  </h2>
                  <p className="text-[10px] text-white/40 mt-2">
                    {ru ? "Обсудить изделие" : "Discuss this piece"} ↗
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <p className="mt-10 border border-white/15 p-8 text-sm text-white/60">
              {ru
                ? "В каталоге пока нет изделий с этой отметкой. Команда может уточнить будущие поступления."
                : "No catalogue pieces carry this label yet. Ask the team about future availability."}
            </p>
          )}
        </>
      )}
      {section === "rewards" && (
        <>
          <p className="max-w-xl mt-6 text-sm leading-relaxed text-white/60">
            {ru
              ? "Полезная работа с вашей вещью. Без условных баллов и обещанных скидок: доступность консультации и условия индивидуальной работы подтверждает команда."
              : "Practical help with your piece. No points or promised discounts: the team confirms consultation availability and terms for individual work."}
          </p>
          <div className="grid sm:grid-cols-3 gap-4 mt-10">
            {(ru
              ? [
                  [
                    "Посадка",
                    "Разберём ваши мерки, желаемый объём и особенности силуэта до заказа.",
                  ],
                  [
                    "Стилизация",
                    "Обсудим сочетания с вашим гардеробом и способы носить изделие.",
                  ],
                  [
                    "Уход",
                    "Уточним рекомендации для конкретного материала и изделия.",
                  ],
                ]
              : [
                  [
                    "Fit",
                    "Discuss measurements, desired volume and silhouette before ordering.",
                  ],
                  [
                    "Styling",
                    "Explore combinations with your wardrobe and ways to wear the piece.",
                  ],
                  [
                    "Care",
                    "Ask for guidance specific to the actual piece and material.",
                  ],
                ]
            ).map(([title, description]) => (
              <article key={title} className="border border-white/15 p-6">
                <h2 className="font-display text-xl">{title}</h2>
                <p className="text-xs leading-relaxed mt-5 text-white/50">
                  {description}
                </p>
              </article>
            ))}
          </div>
        </>
      )}
      <div className="mt-12 border-t border-white/15 pt-8">
        <a
          href={href}
          target={telegramUrl ? "_blank" : undefined}
          rel={telegramUrl ? "noopener noreferrer" : undefined}
          className="inline-flex min-h-12 items-center border border-white/30 px-6 text-xs uppercase hover:bg-white/10"
        >
          {ru ? "Обсудить с RRC" : "Discuss with RRC"} ↗
        </a>
        <p className="text-[11px] text-white/40 mt-4">
          {ru
            ? "Откроется подготовленный запрос. Сообщение отправляете вы; это не заказ и не резерв."
            : "A prepared enquiry will open. You send it yourself; it is not an order or reservation."}
        </p>
      </div>
    </section>
  );
}
