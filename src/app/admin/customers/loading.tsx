export default function CustomersLoading() {
  return (
    <main className="min-h-screen bg-[#05090f] text-white">
      <section className="border-b border-white/[0.06] bg-[#060a0f]">
        <div className="container-primezora py-8">
          <div className="h-3 w-28 animate-pulse bg-white/[0.06]" />
          <div className="mt-8 h-9 w-44 animate-pulse bg-white/[0.06]" />
        </div>
      </section>
      <section className="container-primezora py-8">
        <div className="overflow-hidden border border-white/[0.07] bg-[#080d13]">
          <div className="h-16 animate-pulse border-b border-white/[0.06] bg-white/[0.02]" />
          {Array.from({ length: 7 }, (_, index) => (
            <div key={index} className="flex h-[72px] items-center gap-5 border-b border-white/[0.04] px-4">
              <div className="h-3 w-40 animate-pulse bg-white/[0.05]" />
              <div className="ml-auto h-3 w-20 animate-pulse bg-white/[0.04]" />
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}