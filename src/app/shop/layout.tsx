import type {Metadata} from 'next';
import {siteConfig} from '@/config/site';

// Render search-parameter content on the server instead of indexing an empty Suspense shell.
export const dynamic='force-dynamic';
export const metadata:Metadata={
 title:'Каталог одежды — RRC',
 description:'Каталог RICHRUSSIANCOMMUNITY: одежда, актуальные коллекции и архив. Выберите изделие и согласуйте размер и посадку с командой RRC.',
 alternates:siteConfig.url?{canonical:'/shop'}:undefined,
 openGraph:{title:'Каталог одежды — RRC',description:'Каталог RICHRUSSIANCOMMUNITY: одежда, актуальные коллекции и архив. Выберите изделие и согласуйте размер и посадку с командой RRC.',images:siteConfig.url?[{url:'/images/home/hero.webp',alt:'RICHRUSSIANCOMMUNITY'}]:[],url:siteConfig.url?'/shop':undefined},
};

export default function PageLayout({children}:{children:React.ReactNode}){return children}
