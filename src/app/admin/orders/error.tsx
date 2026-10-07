"use client";

export default function OrdersError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen bg-[#05090f] text-white">
      <section className="container-primezora py-20">
        <div className="mx-auto max-w-xl border border-red-500/20 bg-[#080d13] p-8 text-center">
          <p className="font-display text-[9px] font-bold uppercase tracking-[0.2em] text-red-300">
            Order Management
          </p>
          <h1 className="mt-3 font-display text-xl font-bold uppercase">
            Unable to load orders
          </h1>
          <p className="mt-3 text-xs leading-5 text-white/40">
            {error.message || "An unexpected error occurred."}
          </p>
          <button
            type="button"
            onClick={reset}
            className="mt-6 h-10 border border-orange-500/30 px-5 text-[9px] font-bold uppercase tracking-[0.12em] text-orange-300 transition hover:border-orange-500/60"
          >
            Try Again
          </button>
        </div>
      </section>
    </main>
  );
}