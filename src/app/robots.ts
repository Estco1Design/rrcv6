import type {MetadataRoute} from 'next';
import {siteConfig} from '@/config/site';
export default function robots(): MetadataRoute.Robots {
 return {rules: {userAgent: '*', allow: '/', disallow: ['/account', '/studio', '/private', '/admin', '/api/', '/cart', '/checkout', '/favorites', '/search']}, sitemap: siteConfig.url ? `${siteConfig.url.replace(/\/$/, '')}/sitemap.xml` : undefined};
}
