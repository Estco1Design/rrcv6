'use client';
import {memo} from 'react';
// Static gradients and fine lines: no full-screen turbulence or perpetual SVG motion.
function IntroBackgroundBase(){return <div aria-hidden="true" data-rrc-intro-bg="" className="pointer-events-none absolute inset-0 overflow-hidden">
 <div className="absolute inset-0" style={{background:'radial-gradient(ellipse at 50% 46%, rgba(210,218,228,.07), transparent 65%)'}}/>
 <div className="absolute inset-0 opacity-15" style={{backgroundImage:'linear-gradient(90deg,transparent calc(50% - .5px),rgba(255,255,255,.22) 50%,transparent calc(50% + .5px)),linear-gradient(transparent calc(50% - .5px),rgba(255,255,255,.16) 50%,transparent calc(50% + .5px))',backgroundSize:'25% 100%,100% 33.333%'}}/>
 <div className="absolute inset-0" style={{background:'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,.55) 100%)'}}/>
 </div>;}
export const IntroBackground=memo(IntroBackgroundBase);
