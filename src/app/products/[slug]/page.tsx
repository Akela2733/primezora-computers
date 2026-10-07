import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { toProductView } from "@/lib/product-view";
import ProductDetailsClient from "@/components/products/ProductDetailsClient";

type ProductPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function ProductPage({
  params,
}: ProductPageProps) {
  const { slug } = await params;

  const decodedSlug = decodeURIComponent(slug).trim();

  const dbProduct = await prisma.product.findFirst({
    where: {
      slug: decodedSlug,
    },
  });

  if (!dbProduct) {
    notFound();
  }

  const relatedProducts = await prisma.product.findMany({
    where: {
      category: dbProduct.category,
      id: {
        not: dbProduct.id,
      },
      inStock: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 4,
  });

  const product = toProductView(dbProduct);

  return (
    <ProductDetailsClient
      product={product}
      relatedProducts={relatedProducts.map(toProductView)}
    />
  );
}