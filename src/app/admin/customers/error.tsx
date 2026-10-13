"use client";

export default function CustomersError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen bg-[#030505] text-white/90">
      <section className="container-primezora py-20">
        <div className="mx-auto max-w-xl border border-red-500/20 bg-[#030505] p-8 text-center">
          <h1 className="font-display text-xl font-bold uppercase">
            Unable to load customer information
          </h1>
          <p className="mt-3 text-xs leading-5 text-white/40">
            Please try again in a moment.
          </p>
          <button
            type="button"
            onClick={reset}
            className="mt-6 h-10 border border-amber-600/30 px-5 text-[9px] font-bold uppercase tracking-[0.12em] text-amber-600 transition hover:border-amber-600/60"
          >
            Try Again
          </button>
        </div>
      </section>
    </main>
  );
}