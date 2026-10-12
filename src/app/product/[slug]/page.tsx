import type {Metadata} from "next";
import {siteConfig} from "@/config/site";
import Layout from "@/components/layout/Layout";
import { getProductBySlug, getAllProducts } from "@/lib/data";
import { notFound } from "next/navigation";
import ProductPageClient from "./ProductPageClient";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({params}: ProductPageProps): Promise<Metadata> {
  const {slug} = await params; const product = getProductBySlug(slug);
  if (!product) return {title: 'Изделие не найдено — RRC'};
  return {title: `${product.name} — RRC`, description: product.description ?? undefined,
    alternates: siteConfig.url ? {canonical: `/product/${product.slug}`} : undefined,
    openGraph: {title: product.name, description: product.description ?? undefined, images: siteConfig.url && product.images[0] ? [{url: product.images[0], alt: product.name}] : undefined}};
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  
  if (!product) {
    notFound();
  }
  
  const relatedProducts = getAllProducts()
    .filter(p => p.id !== product.id && p.category === product.category)
    .slice(0, 4);

  return (
    <Layout>
      <ProductPageClient product={product} relatedProducts={relatedProducts} />
    </Layout>
  );
}
