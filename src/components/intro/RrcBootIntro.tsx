'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import {AnimatePresence,motion} from 'framer-motion';
import {useLanguage} from '@/i18n';
import {DialogFocus} from '@/components/ui/DialogFocus';
import {PrivateCodeForm} from '@/components/private/PrivateCodeForm';
import {markPublicEntry} from '@/components/private/PrivateSessionProvider';
const word='RICHRUSSIANCOMMUNITY',ease=[.22,1,.36,1] as const;
export function RrcBootIntro(){
 const {language}=useLanguage(),ru=language==='ru';
 const [visible,setVisible]=useState(false),[mode,setMode]=useState<'entry'|'code'>('entry'),[reduced,setReduced]=useState(true);
 const back=useRef<HTMLButtonElement>(null),restore=useRef(false);
 useEffect(()=>{if(window.location.pathname!=='/')return;try{if(sessionStorage.getItem('rrc_intro_seen')==='true')return;}catch{/* Optional storage. */}const media=matchMedia('(prefers-reduced-motion: reduce)');const sync=()=>setReduced(media.matches);sync();media.addEventListener('change',sync);setVisible(true);return()=>media.removeEventListener('change',sync)},[]);
 const close=useCallback(()=>{try{sessionStorage.setItem('rrc_intro_seen','true')}catch{/* Optional storage. */}window.dispatchEvent(new Event('rrc:enter'));setVisible(false)},[]);
 const enterPublic=useCallback(()=>{markPublicEntry();void fetch('/api/private-access/logout',{method:'POST'}).catch(()=>{/* Server guards remain in place. */});close()},[close]);
 useEffect(()=>{if(!visible)return;const html=document.documentElement,previous=html.style.overflow;html.style.overflow='hidden';return()=>{html.style.overflow=previous}},[visible]);
 useEffect(()=>{if(!visible)return;const key=(e:KeyboardEvent)=>{if(e.key==='Escape'){if(mode==='code'){restore.current=true;setMode('entry')}else enterPublic()}};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key)},[mode,visible,enterPublic]);
 return <AnimatePresence>{visible&&<motion.div role="dialog" aria-modal="true" aria-label={word} data-rrc-boot-intro="" className="fixed inset-0 z-[200] flex min-h-[100svh] items-center justify-center overflow-y-auto bg-black px-6 py-16" initial={{opacity:1}} exit={{opacity:0}} transition={{duration:reduced?0:.32}}>
  <DialogFocus/>
  <div className="w-full max-w-[880px] text-center">
   <div aria-label={word} className="flex justify-center overflow-hidden font-display font-light leading-[1.3] tracking-[.04em] text-white text-[clamp(12px,3.5vw,30px)]">{word.split('').map((letter,i)=><motion.span aria-hidden="true" key={i} className="inline-block" initial={reduced?false:{opacity:0,y:'100%'}} animate={{opacity:1,y:0}} transition={{duration:reduced?0:.65,delay:reduced?0:i*.045,ease}}>{letter}</motion.span>)}</div>
   <div className="mx-auto mt-12 sm:mt-16 max-w-[360px]"><AnimatePresence mode="wait">{mode==='entry'?<motion.div key="entry" onAnimationComplete={()=>{if(restore.current){restore.current=false;back.current?.focus()}}} initial={reduced?false:{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:reduced?0:.25}} className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-7">
    <button type="button" onClick={enterPublic} className="min-h-12 px-6 border border-white/35 text-[10px] font-mono tracking-[.2em] hover:border-white/80">{ru?'ВОЙТИ':'ENTER'}</button>
    <button ref={back} type="button" onClick={()=>setMode('code')} className="min-h-12 px-6 border border-white/15 text-white/65 text-[10px] font-mono tracking-[.14em] hover:text-white hover:border-white/50">PRIVATE ACCESS</button>
   </motion.div>:<motion.div key="code" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:reduced?0:.2}} className="text-left"><PrivateCodeForm variant="overlay" ru={ru} onSuccess={close}/><button type="button" onClick={()=>{restore.current=true;setMode('entry')}} className="mt-5 min-h-11 w-full text-center text-[10px] text-white/45 tracking-[.18em] hover:text-white">{ru?'НАЗАД':'BACK'}</button></motion.div>}</AnimatePresence></div>
  </div>
 </motion.div>}</AnimatePresence>;
}
