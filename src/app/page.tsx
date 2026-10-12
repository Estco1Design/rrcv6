import type {Metadata} from 'next';
import {siteConfig} from '@/config/site';
import HomePageClient from './HomePageClient';
export const metadata:Metadata={
 title:'RICHRUSSIANCOMMUNITY — RRC | EST. 2026',
 description:'RICHRUSSIANCOMMUNITY — одежда с архитектурными силуэтами. Актуальная коллекция и архив RRC: выберите изделие, размер и обсудите посадку с командой.',
 alternates:siteConfig.url?{canonical:'/'}:undefined,
 openGraph:{title:'RICHRUSSIANCOMMUNITY — RRC',description:'Архитектурные силуэты, актуальная коллекция и архив RRC.',url:siteConfig.url?'/':undefined,images:siteConfig.url?[{url:'/images/home/hero.webp',alt:'RICHRUSSIANCOMMUNITY'}]:[]},
};
export default function HomePage(){return <HomePageClient/>}
