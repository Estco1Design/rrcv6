'use client';
import {useEffect,useRef} from 'react';
import {usePathname} from 'next/navigation';
/** Short opacity transitions preserve native navigation, scrolling and form behavior. */
export function PageMotion(){
 const path=usePathname(),previous=useRef(path);
 useEffect(()=>{if(previous.current===path)return;previous.current=path;if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;const main=document.querySelector('main');if(!main?.animate)return;const animation=main.animate([{opacity:.65},{opacity:1}],{duration:220,easing:'cubic-bezier(.22,1,.36,1)'});return()=>animation.cancel()},[path]);
 return null;
}
