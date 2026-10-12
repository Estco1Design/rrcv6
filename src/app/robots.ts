import type {MetadataRoute} from 'next';
import {siteConfig} from '@/config/site';
export default function robots(): MetadataRoute.Robots {
 // Utility pages expose noindex metadata; allow crawlers to read that directive.
 return {rules: {userAgent: '*', allow: '/', disallow: ['/account', '/access', '/studio', '/private', '/api/']}, sitemap: siteConfig.url ? `${siteConfig.url.replace(/\/$/, '')}/sitemap.xml` : undefined};
}
