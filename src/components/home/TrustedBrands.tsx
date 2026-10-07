const brands = [
  { name: "ASUS", style: "font-black italic tracking-[0.06em]" },
  { name: "msi", style: "font-black italic tracking-[0.04em]" },
  { name: "intel", style: "font-semibold lowercase tracking-[0.02em]" },
  { name: "AMD", style: "font-black tracking-[0.08em]" },
  { name: "logitech G", style: "font-bold tracking-[-0.02em]" },
  { name: "CORSAIR", style: "font-black tracking-[0.04em]" },
  { name: "SAMSUNG", style: "font-bold tracking-[0.08em]" },
  { name: "GIGABYTE", style: "font-bold tracking-[0.03em]" },
  { name: "AND MORE...", style: "font-display text-[8px] font-medium tracking-[0.2em]" },
];

function BrandGroup({ hidden = false }: { hidden?: boolean }) {
  return (
    <div className="brand-marquee-group flex shrink-0 items-center" aria-hidden={hidden}>
      {brands.map((brand) => (
        <div
          key={brand.name}
          className="flex h-9 min-w-24 shrink-0 items-center justify-center border-r border-white/10 px-5 text-white/55 transition-colors hover:text-white sm:min-w-32 sm:px-7"
        >
          <span className={`whitespace-nowrap font-display text-[11px] sm:text-xs ${brand.style}`}>
            {brand.name}
          </span>
        </div>
      ))}
    </div>
  );
}

export function TrustedBrands() {
  return (
    <section
      aria-labelledby="trusted-brands-heading"
      className="overflow-hidden border-y border-white/10 bg-[#030607] py-3.5 sm:py-4"
    >
      <div className="container-primezora grid items-center gap-3 sm:grid-cols-[150px_minmax(0,1fr)] sm:gap-5">
        <h2
          id="trusted-brands-heading"
          className="font-display text-[8px] font-semibold uppercase tracking-[0.2em] text-white/45"
        >
          Trusted Brands
        </h2>

        <div
          className="brand-marquee relative min-w-0 overflow-hidden"
          aria-label="ASUS, MSI, Intel, AMD, Logitech G, Corsair, Samsung, Gigabyte, and more"
        >
          <div className="brand-marquee-track flex w-max">
            <BrandGroup />
            <BrandGroup hidden />
          </div>
        </div>
      </div>
    </section>
  );
}
