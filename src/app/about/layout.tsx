import type {Metadata} from 'next';
import {siteConfig} from '@/config/site';

export const metadata:Metadata={
 title:'О бренде — RRC',
 description:'RICHRUSSIANCOMMUNITY: независимый бренд одежды, архитектурные силуэты и индивидуальный подход к посадке. Узнайте о проекте RRC.',
 alternates:siteConfig.url?{canonical:'/about'}:undefined,
 openGraph:{title:'О бренде — RRC',description:'RICHRUSSIANCOMMUNITY: независимый бренд одежды, архитектурные силуэты и индивидуальный подход к посадке. Узнайте о проекте RRC.',images:siteConfig.url?[{url:'/images/home/hero.webp',alt:'RICHRUSSIANCOMMUNITY'}]:[],url:siteConfig.url?'/about':undefined},
};

export default function PageLayout({children}:{children:React.ReactNode}){return children}
