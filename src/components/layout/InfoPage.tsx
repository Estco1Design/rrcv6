'use client';
import Layout from '@/components/layout/Layout';
import {useLanguage} from '@/i18n';
type Section = {title: [string, string]; paragraphs: [string, string][]};
export function InfoPage({title, sections, children}: {title: [string, string]; sections: Section[]; children?: React.ReactNode}) {
 const {language} = useLanguage(); const i = language === 'ru' ? 0 : 1;
 return <Layout><div className="pt-24 md:pt-32 px-4 md:px-8 pb-16"><div className="max-w-3xl mx-auto"><h1 className="font-display text-2xl md:text-3xl font-medium uppercase tracking-wide mb-8 break-words">{title[i]}</h1><div className="space-y-12">{sections.map(section => <section key={section.title[0]}><h2 className="font-display text-lg font-medium uppercase tracking-wide mb-4">{section.title[i]}</h2><div className="space-y-4 text-rrc-off leading-relaxed">{section.paragraphs.map((text, index) => <p key={index}>{text[i]}</p>)}</div></section>)}{children}</div></div></div></Layout>;
}
