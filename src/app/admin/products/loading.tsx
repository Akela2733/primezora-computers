export default function ProductsLoading() {
  return (
    <main className="min-h-screen bg-[#05090f] text-white">
      <section className="border-b border-white/[0.06] bg-[#060a0f]">
        <div className="container-primezora py-8">
          <div className="h-3 w-28 animate-pulse bg-white/[0.06]" />
          <div className="mt-8 h-9 w-44 animate-pulse bg-white/[0.06]" />
          <div className="mt-3 h-4 w-52 animate-pulse bg-white/[0.04]" />
        </div>
      </section>

      <section className="container-primezora py-10">
        <div className="overflow-hidden border border-white/[0.07] bg-[#080d13]">
          <div className="h-16 animate-pulse border-b border-white/[0.06] bg-white/[0.02]" />
          <div className="divide-y divide-white/[0.05]">
            {Array.from({ length: 6 }, (_, index) => (
              <div
                key={index}
                className="flex h-20 items-center gap-5 px-5"
              >
                <div className="h-12 w-12 animate-pulse bg-white/[0.05]" />
                <div className="h-3 w-40 animate-pulse bg-white/[0.05]" />
                <div className="ml-auto h-3 w-20 animate-pulse bg-white/[0.04]" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}