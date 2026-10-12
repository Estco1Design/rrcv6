'use client';
import {useEffect,useRef,useState} from 'react';
export function PreorderFlag(){
 const ref=useRef<HTMLSpanElement>(null);const [visible,setVisible]=useState(false);
 useEffect(()=>{const target=ref.current;if(!target)return;const observer=new IntersectionObserver(([entry])=>setVisible(entry.isIntersecting));observer.observe(target);const sync=()=>{if(document.hidden)setVisible(false);else setVisible(target.getBoundingClientRect().bottom>0&&target.getBoundingClientRect().top<innerHeight)};document.addEventListener('visibilitychange',sync);return()=>{observer.disconnect();document.removeEventListener('visibilitychange',sync)}},[]);
 return <span ref={ref} className={`rrc-preorder-flag ${visible?'is-visible':''}`}><span className="rrc-preorder-dot" aria-hidden="true"/>PRE-ORDER<span aria-hidden="true" className="rrc-preorder-shine"/></span>;
}
