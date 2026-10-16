import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Product } from "@/lib/types";
import { ProductCard } from "@/components/ProductCard";

const API = process.env.API_URL ?? "http://localhost:8000";
const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

async function load(slug: string): Promise<Product | null> {
  const r = await fetch(`${API}/api/products/${slug}`, { next: { revalidate: 60 } });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error("Could not load product");
  return r.json();
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const p = await load(params.slug);
  if (!p) return { title: "Not found" };
  const description = p.description ?? `Order ${p.name} from Cravy.`;
  return { title: p.name, description, alternates: { canonical: `/menu/${p.slug}` }, openGraph: { title: p.name, description, url: `/menu/${p.slug}` } };
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const p = await load(params.slug);
  if (!p) notFound();
  const prices = p.variants.length ? p.variants.map((v) => v.price) : [p.base_price];
  const jsonLd = [
    {
      "@context": "https://schema.org", "@type": "Product", name: p.name, description: p.description ?? undefined, brand: { "@type": "Brand", name: "Cravy" },
      offers: { "@type": "Offer", priceCurrency: "PKR", price: Math.min(...prices), availability: p.is_available ? "https://schema.org/InStock" : "https://schema.org/OutOfStock", url: `${site}/menu/${p.slug}` },
    },
    {
      "@context": "https://schema.org", "@type": "BreadcrumbList",
      itemListElement: [["Home", "/"], ["Menu", "/menu"], [p.name, `/menu/${p.slug}`]].map(([name, path], i) => ({ "@type": "ListItem", position: i + 1, name, item: `${site}${path}` })),
    },
  ];
  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <nav aria-label="Breadcrumb" className="mb-5 text-sm"><ol className="flex gap-2">
        <li><Link href="/" className="underline">Home</Link> /</li><li><Link href="/menu" className="underline">Menu</Link> /</li><li aria-current="page">{p.name}</li>
      </ol></nav>
      <h1 className="mb-6 text-4xl">{p.name}</h1>
      <ProductCard p={p} />
    </main>
  );
}
