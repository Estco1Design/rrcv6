import type {Metadata} from 'next';
import {siteConfig} from '@/config/site';

export const metadata:Metadata={
 title:'Контакты и поддержка — RRC',
 description:'Контакты команды RICHRUSSIANCOMMUNITY. Обратитесь в RRC, чтобы уточнить размер, доступность изделия, условия заказа и изготовления.',
 alternates:siteConfig.url?{canonical:'/contacts'}:undefined,
 openGraph:{title:'Контакты и поддержка — RRC',description:'Контакты команды RICHRUSSIANCOMMUNITY. Обратитесь в RRC, чтобы уточнить размер, доступность изделия, условия заказа и изготовления.',images:siteConfig.url?[{url:'/images/home/hero.webp',alt:'RICHRUSSIANCOMMUNITY'}]:[],url:siteConfig.url?'/contacts':undefined},
};

export default function PageLayout({children}:{children:React.ReactNode}){return children}
