'use client';
import {getProductsBySection} from '@/lib/data';
import {useLanguage} from '@/i18n';
export function ManifestoSection() {
  const {language} = useLanguage(); const count = getProductsBySection('current').length;
  return <section className="py-16 md:py-24 px-4 md:px-8 border-t border-rrc-line"><div className="max-w-3xl mx-auto text-center"><p className="font-display text-xl md:text-2xl lg:text-3xl font-light tracking-wide text-rrc-white uppercase leading-relaxed">RICH RUSSIAN COMMUNITY</p><p className="mt-4 text-t-micro text-rrc-off tracking-widest uppercase">{language === 'ru' ? `ТЕКУЩАЯ КОЛЛЕКЦИЯ — ${count} ОБЪЕКТОВ` : `CURRENT COLLECTION — ${count} OBJECTS`}</p></div></section>;
}
