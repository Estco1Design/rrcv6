'use client';
import {useEffect,useState} from 'react';
// Large scrolling scenes stay still on touch devices, hidden tabs and reduced-motion mode.
export function useDesktopEffects(){
 const [enabled,setEnabled]=useState(false);
 useEffect(()=>{const media=window.matchMedia('(min-width: 768px) and (pointer: fine) and (prefers-reduced-motion: no-preference)');const sync=()=>setEnabled(media.matches && !document.hidden);sync();media.addEventListener('change',sync);document.addEventListener('visibilitychange',sync);return()=>{media.removeEventListener('change',sync);document.removeEventListener('visibilitychange',sync);};},[]);
 return enabled;
}
