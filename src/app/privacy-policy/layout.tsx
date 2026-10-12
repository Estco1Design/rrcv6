import type {Metadata} from 'next';
import {siteConfig} from '@/config/site';

export const metadata:Metadata={
 title:'Политика конфиденциальности — RRC',
 description:'Как RRC обрабатывает данные личного кабинета, мерки и контактные сведения. Хранение профиля, разрешение на передачу команде и удаление аккаунта.',
 alternates:siteConfig.url?{canonical:'/privacy-policy'}:undefined,
 openGraph:{title:'Политика конфиденциальности — RRC',description:'Как RRC обрабатывает данные личного кабинета, мерки и контактные сведения. Хранение профиля, разрешение на передачу команде и удаление аккаунта.',images:siteConfig.url?[{url:'/images/home/hero.webp',alt:'RICHRUSSIANCOMMUNITY'}]:[],url:siteConfig.url?'/privacy-policy':undefined},
};

export default function PageLayout({children}:{children:React.ReactNode}){return children}
