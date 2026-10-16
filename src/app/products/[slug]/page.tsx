import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { toProductView } from "@/lib/product-view";
import {
  addCustomerReviewSummaries,
  combineProductReviewSummary,
} from "@/lib/product-review-summary";
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

  const [reviews, reviewAggregate] = await Promise.all([
    prisma.productReview.findMany({
      where: { productId: dbProduct.id },
      select: {
        id: true,
        rating: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        customer: {
          select: { firstName: true, lastName: true, name: true },
        },
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 50,
    }),
    prisma.productReview.aggregate({
      where: { productId: dbProduct.id },
      _avg: { rating: true },
      _count: { _all: true },
    }),
  ]);

  const reviewSummary = combineProductReviewSummary(dbProduct, reviewAggregate);
  const product = toProductView({ ...dbProduct, ...reviewSummary });
  const initialReviews = reviews.map((review) => ({
    id: review.id,
    rating: review.rating,
    content: review.content,
    customerName:
      [review.customer.firstName, review.customer.lastName]
        .filter(Boolean)
        .join(" ")
        .trim() ||
      review.customer.name ||
      "Customer",
    createdAt: review.createdAt.toISOString(),
    updatedAt: review.updatedAt.toISOString(),
  }));

  return (
    <ProductDetailsClient
      product={product}
      relatedProducts={(
        await addCustomerReviewSummaries(relatedProducts)
      ).map(toProductView)}
      initialReviews={initialReviews}
      initialRating={reviewSummary.rating}
      initialReviewCount={reviewSummary.reviews}
    />
  );
}