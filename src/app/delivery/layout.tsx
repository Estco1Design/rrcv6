import type {Metadata} from 'next';
import {siteConfig} from '@/config/site';

export const metadata:Metadata={
 title:'Заказ, доставка и предзаказ — RRC',
 description:'Условия заказа и доставки RRC: предзаказ, срок изготовления, согласование размера и отправка по тарифам выбранного перевозчика.',
 alternates:siteConfig.url?{canonical:'/delivery'}:undefined,
 openGraph:{title:'Заказ, доставка и предзаказ — RRC',description:'Условия заказа и доставки RRC: предзаказ, срок изготовления, согласование размера и отправка по тарифам выбранного перевозчика.',images:siteConfig.url?[{url:'/images/home/hero.webp',alt:'RICHRUSSIANCOMMUNITY'}]:[],url:siteConfig.url?'/delivery':undefined},
};

export default function PageLayout({children}:{children:React.ReactNode}){return children}
