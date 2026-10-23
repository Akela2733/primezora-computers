import { prisma } from "@/lib/prisma";
import {
  SiAmd,
  SiAsus,
  SiCorsair,
  SiHyperx,
  SiIntel,
  SiMsi,
  SiNvidia,
  SiRedragon,
  type IconType,
} from "@icons-pack/react-simple-icons";
import {
  BadgeCheck,
  CreditCard,
  ShieldCheck,
  Truck,
  type LucideIcon,
} from "lucide-react";
import { getStorefrontContent } from "@/lib/storefront-content";

const brandLogos: Record<string, IconType> = {
  amd: SiAmd,
  asus: SiAsus,
  corsair: SiCorsair,
  hyperx: SiHyperx,
  intel: SiIntel,
  msi: SiMsi,
  nvidia: SiNvidia,
  redragon: SiRedragon,
};

const featuredBrands = [
  "ASUS",
  "AMD",
  "Redragon",
  "Logitech",
  "Corsair",
  "HyperX",
];

const benefitIcons: Record<string, LucideIcon> = {
  BadgeCheck,
  CreditCard,
  ShieldCheck,
  Truck,
};

function BrandGroup({
  brands,
  hidden = false,
}: {
  brands: string[];
  hidden?: boolean;
}) {
  return (
    <div
      className="brand-marquee-group flex min-w-full shrink-0 items-center gap-4 px-3 sm:gap-6 sm:px-4"
      aria-hidden={hidden}
    >
      {brands.map((brand) => {
        const Logo = brandLogos[brand.toLowerCase().replace(/[^a-z0-9]/g, "")];

        return (
          <div
            key={brand}
            className="group flex h-12 min-w-20 shrink-0 items-center justify-center border-r border-white/10 px-2 text-white/65 transition-colors hover:text-white/90 sm:px-3"
            aria-label={brand}
            title={brand}
          >
            {Logo ? (
              <Logo
                aria-hidden="true"
                className="h-8 w-auto max-w-32 transition-colors group-hover:text-white/90 sm:h-10"
                color="currentColor"
              />
            ) : (
              <span className="whitespace-nowrap font-display text-xs font-semibold sm:text-sm">
                {brand}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export async function TrustedBrands() {
  const [brandRecords, content] = await Promise.all([
    prisma.product.findMany({
      where: {
        NOT: {
          slug: { startsWith: "test-only-" },
        },
      },
      distinct: ["brand"],
      select: { brand: true },
      orderBy: { brand: "asc" },
    }),
    getStorefrontContent(),
  ]);

  if (!content) return null;

  const brands = [
    ...new Set([
      ...brandRecords.map(({ brand }) => brand),
      ...featuredBrands,
    ]),
  ];
  const benefits = content.home.hero.benefits;

  return (
    <>
      <section
        aria-label="Shopping benefits"
        data-motion-reveal
        className="border-y border-white/10 bg-[#030505]"
      >
        <div data-motion-stagger className="container-primezora grid divide-y divide-white/10 py-2 sm:grid-cols-3 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
          {benefits.map((benefit, index) => {
            const Icon = benefitIcons[benefit.icon];
            if (!Icon) {
              throw new Error(`Unknown storefront benefit icon: ${benefit.icon}`);
            }

            return (
              <div
                key={`${benefit.title}-${index}`}
                data-motion-reveal
                className="flex items-center gap-3 py-3 sm:px-3 lg:px-5"
              >
                <Icon
                  size={19}
                  strokeWidth={1.8}
                  className="shrink-0 text-orange-500"
                />
                <div className="min-w-0">
                  <p className="font-display text-[9px] font-semibold text-white/90 sm:text-[10px]">
                    {benefit.title}
                  </p>
                  <p className="mt-0.5 text-[8px] text-white/45 sm:text-[9px]">
                    {benefit.subtitle}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {brands.length > 0 && (
        <section
          aria-labelledby="trusted-brands-heading"
          data-motion-reveal
          className="overflow-hidden border-b border-white/10 bg-[#030505] py-3 sm:py-4"
        >
          <div className="mb-2 px-4 sm:mb-3">
            <h2
              id="trusted-brands-heading"
              className="text-center font-display text-[8px] font-semibold uppercase tracking-[0.2em] text-white/45"
            >
              {content.home.brandsLabel}
            </h2>
          </div>

          <div
            className="brand-marquee relative w-full overflow-hidden"
            aria-label={brands.join(", ")}
          >
            <div className="brand-marquee-track flex w-max">
              <BrandGroup brands={brands} />
              <BrandGroup brands={brands} hidden />
            </div>
          </div>
        </section>
      )}
    </>
  );
}
