import type { MetadataRoute } from "next";

const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let slugs: string[] = [];
  try {
    const r = await fetch(`${process.env.API_URL ?? "http://localhost:8000"}/api/menu`, { next: { revalidate: 3600 } });
    const m = await r.json();
    slugs = m.categories.flatMap((c: { products: { slug: string }[] }) => c.products.map((p) => p.slug));
  } catch {}
  return [{ url: `${base}/` }, { url: `${base}/menu` }, ...slugs.map((s) => ({ url: `${base}/menu/${s}` }))];
}
