'use client';
import {useEffect, useRef, useState} from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {motion, useScroll, useTransform, useReducedMotion} from 'framer-motion';
import {useDesktopEffects} from '@/hooks/useDesktopEffects';
import {useLanguage} from '@/i18n';
const ease = [0.22, 1, 0.36, 1] as const;
export function HeroSection() {
  const {language, t} = useLanguage(); const ru = language === 'ru';
  const ref = useRef<HTMLElement>(null); const reduced = useReducedMotion(); const desktopEffects=useDesktopEffects();
  const [error, setError] = useState(false); const [entrance, setEntrance] = useState(0);
  const {scrollYProgress} = useScroll({target: ref, offset:['start start','end start']});
  const progress = scrollYProgress;
  const y = useTransform(progress,[0,1],['0%','20%']);
  const scale = useTransform(progress,[0,1],[1.03,1.14]);
  const textY = useTransform(progress,[0,1],['0%','35%']);
  const opacity = useTransform(progress,[0,0.7],[1,0]);
  useEffect(()=>{const replay=()=>setEntrance(n=>n+1);window.addEventListener('rrc:enter',replay);return()=>window.removeEventListener('rrc:enter',replay);},[]);
  return <section ref={ref} className="relative h-[100svh] min-h-[520px] overflow-hidden bg-rrc-black">
    <motion.div className="absolute inset-0" style={desktopEffects?{y,scale}:undefined}>
      {error?<div className="absolute inset-0 bg-rrc-panel"/>:<Image src="/images/home/hero.webp" alt={t.hero.newCollection} fill priority sizes="100vw" className="object-cover" style={{objectPosition:'center 40%'}} onError={()=>setError(true)}/>}
    </motion.div>
    <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/25 to-black/85"/>
    <div aria-hidden="true" className="absolute inset-0 pointer-events-none" style={{background:'radial-gradient(ellipse at 50% 45%,rgba(112,27,50,.14),transparent 65%)'}}/>
    <div aria-hidden="true" className="absolute top-24 bottom-24 left-4 right-4 md:left-8 md:right-8 border-x border-white/10 pointer-events-none"/>
    <motion.div key={`shutters-${entrance}`} aria-hidden="true" className="absolute inset-0 z-20 pointer-events-none flex" initial={false}>
      {[0,1].map(side=><motion.div key={side} className="h-full w-1/2 bg-rrc-black" initial={reduced?{scaleX:0}:{scaleX:1}} animate={{scaleX:0}} transition={{duration:1.15,ease}} style={{transformOrigin:side===0?'left':'right'}}/>)}
    </motion.div>
    <motion.div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-6 text-center" style={desktopEffects?{y:textY,opacity}:undefined}>
      <div key={`type-${entrance}`}>
        <motion.p className="mb-6 text-[9px] md:text-t-micro tracking-[0.3em] text-rrc-silver uppercase" initial={reduced?false:{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:0.25,duration:0.8,ease}}>{t.hero.fallWinter}</motion.p>
        <h1 className="font-display font-medium text-[#F5F0E8] tracking-[0.06em] leading-tight whitespace-nowrap text-[clamp(12px,3.2vw,42px)]" aria-label="RICHRUSSIANCOMMUNITY">
          {['RICH','RUSSIAN','COMMUNITY'].map((word,i)=><span key={word} className="inline-block overflow-hidden align-bottom"><motion.span aria-hidden="true" className="inline-block" initial={reduced?false:{y:'110%'}} animate={{y:0}} transition={{delay:0.2+i*0.12,duration:0.95,ease}}>{word}</motion.span></span>)}
        </h1>
        <motion.div initial={reduced?false:{opacity:0,y:18}} animate={{opacity:1,y:0}} transition={{delay:0.55,duration:0.8,ease}}>
          <Link href="/shop?section=current" className="rrc-hero-link mt-8 md:mt-10 inline-flex items-center gap-5 border border-white/50 px-7 md:px-10 py-4 text-[10px] md:text-xs tracking-[0.18em] uppercase text-rrc-white hover:border-rrc-wine focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-rrc-white transition-colors"><span>{t.hero.viewCollection}</span><span aria-hidden="true" className="rrc-hero-arrow">↗</span></Link>
        </motion.div>
      </div>
    </motion.div>
    <div className="absolute bottom-20 md:bottom-8 left-6 md:left-8 right-6 md:right-8 z-10 flex justify-between items-end text-[9px] tracking-[0.2em] text-rrc-silver uppercase">
      <span>RRC / EST. 2026</span><a href="#current-selection" className="flex items-center gap-3 py-3">{ru?'ЛИСТАЙТЕ':'SCROLL'}<span aria-hidden="true" className="rrc-scroll-line"/></a><span className="hidden md:block">MOSCOW</span>
    </div>
  </section>;
}
