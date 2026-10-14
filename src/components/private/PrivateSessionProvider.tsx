'use client';
import {createContext,useCallback,useContext,useEffect,useState} from 'react';
const key='rrc_private_entry';
const event='rrc:private-access';
export function markPrivateEntry(){try{sessionStorage.setItem(key,'private')}catch{/* UI hint only. */}window.dispatchEvent(new Event(event));}
export function markPublicEntry(){try{sessionStorage.removeItem(key)}catch{/* UI hint only. */}window.dispatchEvent(new Event(event));}
const Context=createContext({active:false});
/** A visibility hint is never authorization. SQLite validates every private page and API. */
export function PrivateSessionProvider({children}:{children:React.ReactNode}){
 const [active,setActive]=useState(false);
 const refresh=useCallback(async()=>{
  let selected=false;try{selected=sessionStorage.getItem(key)==='private'}catch{/* Keep hidden. */}
  if(!selected){setActive(false);return;}
  try{const response=await fetch('/api/private-access/session',{cache:'no-store'});const data=await response.json();setActive(response.ok&&data.active===true&&sessionStorage.getItem(key)==='private');}catch{setActive(false)}
 },[]);
 useEffect(()=>{void refresh();const change=()=>{void refresh()},focus=()=>{if(!document.hidden)void refresh()};window.addEventListener(event,change);document.addEventListener('visibilitychange',focus);return()=>{window.removeEventListener(event,change);document.removeEventListener('visibilitychange',focus)}},[refresh]);
 return <Context.Provider value={{active}}>{children}</Context.Provider>;
}
export const usePrivateSession=()=>useContext(Context);
