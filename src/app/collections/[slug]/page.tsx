import type {Metadata} from 'next';
import {collections} from '@/lib/data';
import {notFound} from 'next/navigation';
import CollectionContent from './CollectionContent';
export async function generateMetadata({params}: {params: Promise<{slug: string}>}): Promise<Metadata> {
 const {slug} = await params; const collection = collections.find(c => c.slug === slug); return {title: collection ? `${collection.name} — RRC` : 'RRC'};
}
export default async function CollectionPage({params}: {params: Promise<{slug: string}>}) {
  const {slug} = await params; if (!collections.some(c => c.slug === slug)) notFound();
  return <CollectionContent slug={slug}/>;
}
