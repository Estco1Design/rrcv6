'use client';
import {createContext,useCallback,useContext,useEffect,useRef,useState} from 'react';
import {usePathname} from 'next/navigation';
const key='rrc_private_entry';
const event='rrc:private-access';
export function markPrivateEntry(){try{sessionStorage.setItem(key,'private');sessionStorage.setItem('rrc_intro_seen','true');sessionStorage.setItem('rrc_cut_played','true')}catch{/* UI hint only. */}window.dispatchEvent(new Event(event));}
export function markPublicEntry(){try{sessionStorage.removeItem(key)}catch{/* UI hint only. */}window.dispatchEvent(new Event(event));}
const Context=createContext({active:false});
/** A visibility hint is never authorization. SQLite validates every private page and API. */
export function PrivateSessionProvider({children}:{children:React.ReactNode}){
 const [active,setActive]=useState(false),generation=useRef(0),path=usePathname();
 const refresh=useCallback(async()=>{
  const request=++generation.current;
  let selected=false;try{selected=sessionStorage.getItem(key)==='private'}catch{/* Keep hidden. */}
  if(!selected){setActive(false);return;}
  try{const response=await fetch('/api/private-access/session',{cache:'no-store'});const data=await response.json();if(request===generation.current)setActive(response.ok&&data.active===true&&sessionStorage.getItem(key)==='private');}catch{if(request===generation.current)setActive(false)}
 },[]);
 useEffect(()=>{void refresh();const change=()=>{void refresh()},focus=()=>{if(!document.hidden)void refresh()};window.addEventListener(event,change);document.addEventListener('visibilitychange',focus);return()=>{window.removeEventListener(event,change);document.removeEventListener('visibilitychange',focus)}},[refresh]);
 useEffect(()=>{void refresh()},[path,refresh]);
 return <Context.Provider value={{active}}>{children}</Context.Provider>;
}
export const usePrivateSession=()=>useContext(Context);
