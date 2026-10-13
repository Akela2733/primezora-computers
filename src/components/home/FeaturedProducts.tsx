import { prisma } from "@/lib/prisma";
import { toProductView } from "@/lib/product-view";
import FeaturedProductsTrack from "./FeaturedProductsTrack";

export async function FeaturedProducts() {
  const productRecords = await prisma.product.findMany({
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
  });

  return (
    <FeaturedProductsTrack
      products={productRecords.map(toProductView)}
    />
  );
}
