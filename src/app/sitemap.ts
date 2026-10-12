import type {MetadataRoute} from 'next';
import {siteConfig} from '@/config/site';
import {getAllProducts} from '@/lib/products';
import {collections} from '@/lib/data';
export default function sitemap(): MetadataRoute.Sitemap {
 if (!siteConfig.url) return [];
 const root = siteConfig.url.replace(/\/$/, '');
 return ['','/shop','/collections','/about','/contacts','/delivery','/privacy-policy', ...collections.map(c => `/collections/${c.slug}`), ...getAllProducts().map(p => `/product/${p.slug}`)].map(path => ({url: `${root}${path}`}));
}
