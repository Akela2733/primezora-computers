import { prisma } from "@/lib/prisma";
import { toProductView } from "@/lib/product-view";
import { addCustomerReviewSummaries } from "@/lib/product-review-summary";
import { getStorefrontContent } from "@/lib/storefront-content";
import FeaturedProductsTrack from "./FeaturedProductsTrack";

export async function FeaturedProducts() {
  const [productRecords, content] = await Promise.all([
    prisma.product.findMany({
      where: { featured: true },
      orderBy: { createdAt: "desc" },
    }),
    getStorefrontContent(),
  ]);

  if (!content) return null;

  return (
    <FeaturedProductsTrack
      products={(await addCustomerReviewSummaries(productRecords)).map(toProductView)}
      content={content.home.featured}
    />
  );
}
