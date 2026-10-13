import { prisma } from "@/lib/prisma";
import { getStorefrontContent } from "@/lib/storefront-content";

function BrandGroup({
  brands,
  hidden = false,
}: {
  brands: string[];
  hidden?: boolean;
}) {
  return (
    <div className="brand-marquee-group flex shrink-0 items-center" aria-hidden={hidden}>
      {brands.map((brand) => (
        <div
          key={brand}
          className="flex h-9 min-w-24 shrink-0 items-center justify-center border-r border-white/10 px-5 text-white/55 transition-colors hover:text-white/90 sm:min-w-32 sm:px-7"
        >
          <span className="whitespace-nowrap font-display text-[11px] font-semibold sm:text-xs">
            {brand}
          </span>
        </div>
      ))}
    </div>
  );
}

export async function TrustedBrands() {
  const [brandRecords, content] = await Promise.all([
    prisma.product.findMany({
      distinct: ["brand"],
      select: {
        brand: true,
      },
      orderBy: {
        brand: "asc",
      },
    }),
    getStorefrontContent(),
  ]);
  const brands = brandRecords.map(({ brand }) => brand);

  if (brands.length === 0 || !content) {
    return null;
  }

  return (
    <section
      aria-labelledby="trusted-brands-heading"
      className="overflow-hidden border-y border-white/10 bg-[#030505] py-3.5 sm:py-4"
    >
      <div className="container-primezora grid items-center gap-3 sm:grid-cols-[150px_minmax(0,1fr)] sm:gap-5">
        <h2
          id="trusted-brands-heading"
          className="font-display text-[8px] font-semibold uppercase tracking-[0.2em] text-white/45"
        >
          {content.home.brandsLabel}
        </h2>

        <div
          className="brand-marquee relative min-w-0 overflow-hidden"
          aria-label={brands.join(", ")}
        >
          <div className="brand-marquee-track flex w-max">
            <BrandGroup brands={brands} />
            <BrandGroup brands={brands} hidden />
          </div>
        </div>
      </div>
    </section>
  );
}
