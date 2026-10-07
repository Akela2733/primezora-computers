"use client";

export default function ApplicationError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-[calc(100vh-76px)] items-center justify-center px-4 py-12">
      <section className="w-full max-w-xl border border-white/8 bg-[#080d13] p-8 text-center text-white">
        <p className="font-display text-[9px] uppercase tracking-[0.25em] text-orange-400">
          Service temporarily unavailable
        </p>
        <h1 className="mt-3 font-display text-2xl font-bold">
          We couldn&apos;t load this page
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-white/55">
          Please try again in a moment. Your sign-in status has not changed.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-7 border border-amber-500 bg-amber-500 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-black transition hover:bg-amber-400"
        >
          Try again
        </button>
      </section>
    </main>
  );
}
