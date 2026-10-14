'use client';
import Link from 'next/link';
import {motion,useReducedMotion} from 'framer-motion';
import {useLanguage} from '@/i18n';
export function PrivateWelcome(){
 const {language}=useLanguage(),ru=language==='ru',reduced=useReducedMotion();
 return <section className="relative flex min-h-[100svh] items-center justify-center overflow-hidden bg-black px-6 py-20 text-center" data-private-welcome="">
  <svg aria-hidden="true" viewBox="0 0 1000 800" className="absolute inset-0 h-full w-full pointer-events-none" preserveAspectRatio="xMidYMid slice"><motion.g initial={reduced?false:{opacity:0}} animate={{opacity:1}} transition={{duration:1}} fill="none" stroke="white" strokeWidth=".6">
   {['M230 170H770V630H230Z','M320 250H680V550H320Z','M230 170L320 250 M770 170L680 250 M230 630L320 550 M770 630L680 550','M500 120V680'].map((d,i)=><motion.path key={d} d={d} opacity={i===3?.035:.12} initial={reduced?false:{pathLength:0}} animate={{pathLength:1}} transition={{duration:reduced?0:1.3,delay:reduced?0:i*.12,ease:[.22,1,.36,1]}}/>)}</motion.g></svg>
  <motion.div className="relative w-full max-w-lg" initial={reduced?false:{opacity:0,y:6}} animate={{opacity:1,y:0}} transition={{duration:reduced?0:.7,delay:reduced?0:.35}}>
   <p className="mb-9 font-mono text-[9px] tracking-[.3em] text-white/35">PRIVATE ACCESS</p>
   <h1 className="font-display font-light text-[clamp(24px,4vw,42px)] leading-[1.4]">{ru?'Поздравляем.':'Welcome.'}<br/>{ru?'Ты внутри.':'You are inside.'}</h1>
   <p className="mx-auto mt-7 max-w-xs text-xs leading-relaxed text-white/45">{ru?'Ближе к бренду. Раньше остальных. На своих условиях.':'Closer to the brand. Ahead of the public release. On your terms.'}</p>
   <Link href="/private/home" className="mt-12 inline-flex min-h-12 items-center justify-center border border-white/25 px-8 font-mono text-[10px] tracking-[.18em] hover:border-white/70">{ru?'ПРОДОЛЖИТЬ':'CONTINUE'}</Link>
  </motion.div>
 </section>;
}
