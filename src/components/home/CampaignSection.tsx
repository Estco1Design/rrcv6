"use client";
import Image from 'next/image';
import Link from 'next/link';
import {homeCampaignImage} from '@/config/media';
import {useLanguage} from '@/i18n';
export function CampaignSection(){
 const {language}=useLanguage();
 return <section className="relative mx-5 md:mx-10 h-[65svh] min-h-[400px] md:h-[75vh] overflow-hidden bg-rrc-panel">
  <Image src={homeCampaignImage} alt="RRC editorial" fill sizes="100vw" className="object-cover"/>
  <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent"/>
  <Link href="/shop?section=archive" className="absolute bottom-10 left-8 inline-flex min-h-12 items-center border-b border-white/50 text-[10px] tracking-[.16em] text-white">{language==='ru'?'Архив':'Archive'}</Link>
 </section>;
}
