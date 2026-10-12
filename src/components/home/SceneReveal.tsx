'use client';
import {useEffect,useRef,type ReactNode} from 'react';
// Content remains visible without JavaScript. Only off-screen elements are prepared for reveal.
export function SceneReveal({children,className=''}:{children:ReactNode;className?:string}) {
 const ref=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  const el=ref.current;if(!el)return;
  const media=window.matchMedia('(prefers-reduced-motion: reduce)');
  if(media.matches || !('IntersectionObserver' in window))return;
  if(el.getBoundingClientRect().top>window.innerHeight*0.95)el.classList.add('rrc-reveal-pending');
  const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){el.classList.remove('rrc-reveal-pending');observer.disconnect();}},{threshold:0.05});observer.observe(el);
  const reset=()=>{if(media.matches)el.classList.remove('rrc-reveal-pending');};media.addEventListener('change',reset);
  return()=>{observer.disconnect();media.removeEventListener('change',reset);};
 },[]);
 return <div ref={ref} className={`rrc-scene-reveal ${className}`}>{children}</div>;
}
