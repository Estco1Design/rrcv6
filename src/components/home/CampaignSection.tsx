'use client';
import {useRef} from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {motion,useScroll,useTransform} from 'framer-motion';
import {homeCampaignImage} from '@/config/media';
import {useDesktopEffects} from '@/hooks/useDesktopEffects';
import {useLanguage} from '@/i18n';
export function CampaignSection(){
 const ref=useRef<HTMLElement>(null);const desktopEffects=useDesktopEffects();const {language}=useLanguage();
 const {scrollYProgress}=useScroll({target:ref,offset:['start end','end start']});
 const left=useTransform(scrollYProgress,[0,1],['-5%','5%']);const right=useTransform(scrollYProgress,[0,1],['5%','-5%']);
 return <section ref={ref} className="relative h-[65svh] min-h-[440px] md:h-[80vh] overflow-hidden bg-rrc-panel border-y border-rrc-line">
   <Image src={homeCampaignImage} alt="RICHRUSSIANCOMMUNITY — editorial" fill sizes="100vw" className="object-cover opacity-60" style={{objectPosition:'center'}}/>
   <div className="absolute inset-0 bg-gradient-to-b from-rrc-black/60 via-rrc-black/20 to-rrc-black/80"/>
   <div className="absolute inset-0 flex flex-col justify-center items-center text-center pointer-events-none" aria-label="RICH RUSSIAN COMMUNITY">
     <motion.p aria-hidden="true" className="font-display text-[clamp(32px,9vw,140px)] font-medium text-rrc-white leading-[1.1] whitespace-nowrap" style={desktopEffects?{x:left}:undefined}>RICH RUSSIAN</motion.p>
     <motion.p aria-hidden="true" className="font-display text-[clamp(32px,9vw,140px)] font-medium text-rrc-white leading-[1.1] whitespace-nowrap" style={desktopEffects?{x:right}:undefined}>COMMUNITY</motion.p>
   </div>
   <Link href="/shop?section=archive" className="absolute bottom-12 left-1/2 -translate-x-1/2 text-[10px] tracking-[0.2em] uppercase text-rrc-white border-b border-white/40 pb-3 whitespace-nowrap">{language==='ru'?'СМОТРЕТЬ АРХИВ':'EXPLORE ARCHIVE'} ↗</Link>
 </section>;
}
