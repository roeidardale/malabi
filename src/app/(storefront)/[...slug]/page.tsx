import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { resolveStorefrontPath } from "@/lib/storefrontPath";
import { Breadcrumbs } from "@/components/storefront/Breadcrumbs";
import { CategoryView } from "@/components/storefront/CategoryView";
import { ProductView } from "@/components/storefront/ProductView";

type Props = {
  params: Promise<{ slug: string[] }>;
  searchParams: Promise<{ page?: string }>;
};

async function resolve(params: Props["params"]) {
  const { slug } = await params;
  return resolveStorefrontPath(slug.map((segment) => decodeURIComponent(segment)).join("/"));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolved = await resolve(params);
  if (!resolved) return {};

  switch (resolved.type) {
    case "category":
      return { title: resolved.category.name };
    case "product":
      return { title: resolved.product.name, description: resolved.product.descriptionShort ?? undefined };
    case "page":
      return { title: resolved.title };
  }
}

// One route handles every catalog URL (category, product, static page); the
// resolver decides which view to render.
export default async function StorefrontPathPage({ params, searchParams }: Props) {
  const resolved = await resolve(params);
  if (!resolved) notFound();

  switch (resolved.type) {
    case "category": {
      const { page } = await searchParams;
      const pageNumber = Math.max(1, Math.floor(Number(page)) || 1);
      return <CategoryView category={resolved.category} page={pageNumber} />;
    }
    case "product":
      return <ProductView product={resolved.product} category={resolved.category} />;
    case "page":
      return (
        <article className="mx-auto flex max-w-2xl flex-col gap-6">
          <Breadcrumbs items={[]} trailingLabel={resolved.title} />
          <h1 className="font-display text-3xl sm:text-4xl">{resolved.title}</h1>
          <div
            className="rich-text"
            dangerouslySetInnerHTML={{ __html: resolved.bodyHtml }}
          />
        </article>
      );
  }
}
