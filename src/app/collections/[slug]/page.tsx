import type {Metadata} from 'next';
import {siteConfig} from '@/config/site';
import {collections} from '@/lib/data';
import {notFound} from 'next/navigation';
import CollectionContent from './CollectionContent';
export async function generateMetadata({params}: {params: Promise<{slug: string}>}): Promise<Metadata> {
 const {slug} = await params;
 const collection = collections.find(c => c.slug === slug);
 if (!collection) return {title:'Коллекция не найдена — RRC',robots:{index:false}};
 return {
  title:`${collection.name} — RRC`,
  description:collection.description,
  alternates:siteConfig.url?{canonical:`/collections/${collection.slug}`}:undefined,
  openGraph:{title:`${collection.name} — RRC`,description:collection.description,url:siteConfig.url?`/collections/${collection.slug}`:undefined,images:siteConfig.url?[{url:collection.image,alt:collection.name}]:[]},
 };
}
export default async function CollectionPage({params}: {params: Promise<{slug: string}>}) {
  const {slug} = await params; if (!collections.some(c => c.slug === slug)) notFound();
  return <CollectionContent slug={slug}/>;
}
