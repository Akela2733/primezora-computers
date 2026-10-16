"use client";

import Link from "next/link";
import { Star } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

export type ProductReviewView = {
  id: string;
  rating: number;
  content: string;
  customerName: string;
  createdAt: string;
  updatedAt: string;
};

type ProductReviewsProps = {
  slug: string;
  initialReviews: ProductReviewView[];
  initialRating: number;
  initialReviewCount: number;
  onSummaryChange: (rating: number, reviewCount: number) => void;
};

type ReviewSummaryResponse = {
  reviews: ProductReviewView[];
  ownReview: { rating: number; content: string } | null;
  rating: number;
  reviewCount: number;
  authenticated: boolean;
};

export default function ProductReviews({
  slug,
  initialReviews,
  initialRating,
  initialReviewCount,
  onSummaryChange,
}: ProductReviewsProps) {
  const [reviews, setReviews] = useState(initialReviews);
  const [rating, setRating] = useState(0);
  const [content, setContent] = useState("");
  const [hasOwnReview, setHasOwnReview] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [summary, setSummary] = useState({
    rating: initialRating,
    reviewCount: initialReviewCount,
  });

  useEffect(() => {
    let active = true;

    async function loadReviews() {
      try {
        const response = await fetch(
          `/api/products/${encodeURIComponent(slug)}/reviews`,
          { cache: "no-store" }
        );
        const result = (await response.json()) as
          | ReviewSummaryResponse
          | { error?: string };

        if (!response.ok) {
          throw new Error(
            "error" in result && result.error
              ? result.error
              : "Unable to load product reviews."
          );
        }

        if (!active || !("reviews" in result)) return;
        setReviews(result.reviews);
        setSummary({
          rating: result.rating,
          reviewCount: result.reviewCount,
        });
        setAuthenticated(result.authenticated);
        if (result.ownReview) {
          setHasOwnReview(true);
          setRating(result.ownReview.rating);
          setContent(result.ownReview.content);
        }
        onSummaryChange(result.rating, result.reviewCount);
      } catch (loadError) {
        if (!active) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load product reviews."
        );
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void loadReviews();
    return () => {
      active = false;
    };
  }, [onSummaryChange, slug]);

  async function submitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setIsSaving(true);

    try {
      const response = await fetch(
        `/api/products/${encodeURIComponent(slug)}/reviews`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rating, content }),
        }
      );
      const result = (await response.json()) as
        | {
            review: ProductReviewView;
            rating: number;
            reviewCount: number;
          }
        | { error?: string };

      if (!response.ok) {
        if (response.status === 401) {
          setAuthenticated(false);
        }
        throw new Error(
          "error" in result && result.error
            ? result.error
            : "Unable to save your review."
        );
      }
      if (!("review" in result)) {
        throw new Error("Unable to save your review.");
      }

      setReviews((current) => [
        result.review,
        ...current.filter((review) => review.id !== result.review.id),
      ].slice(0, 50));
      setHasOwnReview(true);
      setAuthenticated(true);
      setSummary({
        rating: result.rating,
        reviewCount: result.reviewCount,
      });
      onSummaryChange(result.rating, result.reviewCount);
      setSuccess("Your review has been published.");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to save your review."
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section
      id="customer-reviews"
      className="border-y border-white/[0.07] bg-[#050707]"
    >
      <div className="container-primezora py-12 sm:py-16">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[8px] uppercase tracking-[0.28em] text-amber-600">
              Customer feedback
            </p>
            <h2 className="mt-3 text-2xl font-bold sm:text-3xl">
              Reviews &amp; Ratings
            </h2>
          </div>
          <div className="flex items-center gap-3" aria-label={`${summary.rating.toFixed(1)} out of 5 stars`}>
            <Star size={22} className="fill-amber-600 text-amber-600" />
            <span className="text-2xl font-bold text-white/90">
              {summary.rating.toFixed(1)}
            </span>
            <span className="text-xs text-white/40">
              ({summary.reviewCount} {summary.reviewCount === 1 ? "review" : "reviews"})
            </span>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <form
            onSubmit={submitReview}
            className="border border-white/[0.08] bg-white/[0.02] p-5 sm:p-6"
          >
            <h3 className="text-sm font-semibold text-white/85">
              {hasOwnReview ? "Update your review" : "Write a review"}
            </h3>
            {!authenticated && !isLoading && (
              <p className="mt-2 text-xs leading-5 text-white/45">
                Please{" "}
                <Link
                  href={`/login?next=${encodeURIComponent(`/products/${slug}#customer-reviews`)}`}
                  className="text-amber-500 underline underline-offset-4 hover:text-amber-400"
                >
                  sign in
                </Link>{" "}
                to leave a review.
              </p>
            )}

            <fieldset className="mt-5">
              <legend className="text-xs font-medium text-white/60">
                Your rating
              </legend>
              <div className="mt-2 flex gap-1" role="radiogroup" aria-label="Rating">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={rating === value}
                    aria-label={`${value} ${value === 1 ? "star" : "stars"}`}
                    onClick={() => setRating(value)}
                    className="rounded p-1 transition hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500"
                  >
                    <Star
                      size={24}
                      className={
                        value <= rating
                          ? "fill-amber-500 text-amber-500"
                          : "text-white/20"
                      }
                    />
                  </button>
                ))}
              </div>
            </fieldset>

            <label
              htmlFor="product-review-content"
              className="mt-5 block text-xs font-medium text-white/60"
            >
              Your review
            </label>
            <textarea
              id="product-review-content"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              maxLength={3_000}
              rows={5}
              required
              placeholder="Share your experience with this product..."
              className="mt-2 w-full resize-y border border-white/10 bg-black/30 px-3 py-2 text-sm leading-6 text-white/85 outline-none placeholder:text-white/25 focus:border-amber-600/60"
            />
            <p className="mt-1 text-right text-[10px] text-white/30">
              {content.length}/3,000
            </p>

            {error && (
              <p role="alert" className="mt-3 text-xs leading-5 text-red-300">
                {error}
                {!authenticated && (
                  <>
                    {" "}
                    <Link
                      href={`/login?next=${encodeURIComponent(`/products/${slug}#customer-reviews`)}`}
                      className="underline underline-offset-2"
                    >
                      Sign in
                    </Link>
                  </>
                )}
              </p>
            )}
            {success && (
              <p role="status" className="mt-3 text-xs text-emerald-300">
                {success}
              </p>
            )}

            <button
              type="submit"
              disabled={isSaving || isLoading || rating === 0 || !content.trim()}
              className="mt-5 w-full bg-amber-600 px-4 py-3 text-[10px] font-bold uppercase tracking-[0.15em] text-black transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/35"
            >
              {isSaving
                ? "Publishing..."
                : hasOwnReview
                  ? "Update review"
                  : "Submit review"}
            </button>
          </form>

          <div>
            <h3 className="text-sm font-semibold text-white/85">
              What customers say
            </h3>
            {isLoading && (
              <p className="mt-5 text-xs text-white/40">Loading reviews...</p>
            )}
            {!isLoading && reviews.length === 0 && (
              <p className="mt-5 border border-white/[0.07] p-5 text-sm text-white/45">
                No written reviews yet. Be the first to share your experience.
              </p>
            )}
            <div className="mt-4 space-y-3">
              {reviews.map((review) => (
                <article
                  key={review.id}
                  className="border border-white/[0.07] bg-white/[0.015] p-5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white/80">
                        {review.customerName}
                      </p>
                      <time
                        dateTime={review.createdAt}
                        className="mt-1 block text-[10px] text-white/35"
                      >
                        {new Date(review.createdAt).toLocaleDateString("en-LK", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </time>
                    </div>
                    <div
                      className="flex gap-0.5"
                      aria-label={`${review.rating} out of 5 stars`}
                    >
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={13}
                          className={
                            star <= review.rating
                              ? "fill-amber-500 text-amber-500"
                              : "text-white/15"
                          }
                        />
                      ))}
                    </div>
                  </div>
                  <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-white/65">
                    {review.content}
                  </p>
                </article>
              ))}
              {reviews.length >= 50 && (
                <p className="pt-2 text-xs text-white/35">
                  Showing the 50 most recent reviews.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
