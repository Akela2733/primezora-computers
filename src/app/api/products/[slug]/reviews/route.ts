import { NextResponse } from "next/server";

import { requireCustomerApiWithProfileCheck, getCustomerSession } from "@/lib/customer-auth";
import { INPUT_LIMITS } from "@/lib/input-limits";
import { prisma } from "@/lib/prisma";
import { enforceRateLimits, getClientIp } from "@/lib/rate-limit";
import { parseProductReviewInput } from "@/lib/product-review-validation";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

const REVIEW_SELECT = {
  id: true,
  rating: true,
  content: true,
  createdAt: true,
  updatedAt: true,
  customer: {
    select: { firstName: true, lastName: true, name: true },
  },
} as const;

function formatReview(review: {
  id: string;
  rating: number;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  customer: {
    firstName: string | null;
    lastName: string | null;
    name: string | null;
  };
}) {
  const profileName = [review.customer.firstName, review.customer.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  return {
    id: review.id,
    rating: review.rating,
    content: review.content,
    customerName: profileName || review.customer.name || "Customer",
    createdAt: review.createdAt.toISOString(),
    updatedAt: review.updatedAt.toISOString(),
  };
}

export async function GET(request: Request, context: RouteContext) {
  const rateLimitResponse = await enforceRateLimits(request, [
    { policy: "publicCatalogIp", identifier: getClientIp(request) },
  ]);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const { slug } = await context.params;
    if (slug.length > INPUT_LIMITS.product.slug) {
      return NextResponse.json({ error: "Product slug is too long." }, { status: 400 });
    }

    const product = await prisma.product.findUnique({
      where: { slug },
      select: { id: true, rating: true, reviews: true },
    });
    if (!product) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    const [reviews, aggregate, session] = await Promise.all([
      prisma.productReview.findMany({
        where: { productId: product.id },
        select: REVIEW_SELECT,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: 50,
      }),
      prisma.productReview.aggregate({
        where: { productId: product.id },
        _avg: { rating: true },
        _count: { _all: true },
      }),
      getCustomerSession(),
    ]);

    const ownReview = session
      ? await prisma.productReview.findUnique({
          where: {
            productId_customerId: {
              productId: product.id,
              customerId: session.customer.id,
            },
          },
          select: { rating: true, content: true },
        })
      : null;

    return NextResponse.json({
      reviews: reviews.map(formatReview),
      ownReview,
      rating: aggregate._avg.rating ?? product.rating,
      reviewCount: aggregate._count._all || product.reviews,
      authenticated: Boolean(session),
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("PRODUCT REVIEWS GET ERROR:", error);
    return NextResponse.json(
      { error: "Unable to load product reviews." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request, context: RouteContext) {
  const { session, response } = await requireCustomerApiWithProfileCheck();
  if (response) return response;

  const rateLimitResponse = await enforceRateLimits(request, [
    { policy: "publicCatalogIp", identifier: getClientIp(request) },
    {
      policy: "customerProductReview",
      identifier: `customer:${session.customer.id}`,
    },
  ]);
  if (rateLimitResponse) return rateLimitResponse;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Provide valid review details." }, { status: 400 });
  }

  const input = parseProductReviewInput(body);
  if (!input) {
    return NextResponse.json(
      { error: "Choose 1–5 stars and enter a review of up to 3,000 characters." },
      { status: 400 }
    );
  }

  try {
    const { slug } = await context.params;
    if (slug.length > INPUT_LIMITS.product.slug) {
      return NextResponse.json({ error: "Product slug is too long." }, { status: 400 });
    }

    const product = await prisma.product.findUnique({
      where: { slug },
      select: { id: true, rating: true, reviews: true },
    });
    if (!product) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    const savedReview = await prisma.productReview.upsert({
      where: {
        productId_customerId: {
          productId: product.id,
          customerId: session.customer.id,
        },
      },
      create: {
        productId: product.id,
        customerId: session.customer.id,
        rating: input.rating,
        content: input.content,
      },
      update: { rating: input.rating, content: input.content },
      select: REVIEW_SELECT,
    });
    const aggregate = await prisma.productReview.aggregate({
      where: { productId: product.id },
      _avg: { rating: true },
      _count: { _all: true },
    });

    return NextResponse.json({
      review: formatReview(savedReview),
      rating: aggregate._avg.rating ?? product.rating,
      reviewCount: aggregate._count._all || product.reviews,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("PRODUCT REVIEW POST ERROR:", error);
    return NextResponse.json(
      { error: "Unable to save your review. Please try again." },
      { status: 500 }
    );
  }
}
