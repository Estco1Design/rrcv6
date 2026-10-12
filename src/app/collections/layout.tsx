import type {Metadata} from 'next';
import {siteConfig} from '@/config/site';

export const metadata:Metadata={
 title:'Коллекции одежды — RRC',
 description:'Коллекции RICHRUSSIANCOMMUNITY: актуальные сезоны и архив бренда. Изучите силуэты, материалы и изделия каждой коллекции.',
 alternates:siteConfig.url?{canonical:'/collections'}:undefined,
 openGraph:{title:'Коллекции одежды — RRC',description:'Коллекции RICHRUSSIANCOMMUNITY: актуальные сезоны и архив бренда. Изучите силуэты, материалы и изделия каждой коллекции.',images:siteConfig.url?[{url:'/images/home/hero.webp',alt:'RICHRUSSIANCOMMUNITY'}]:[],url:siteConfig.url?'/collections':undefined},
};

export default function PageLayout({children}:{children:React.ReactNode}){return children}
