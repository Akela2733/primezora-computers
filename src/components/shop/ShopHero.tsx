import Link from "next/link";
import { ChevronRight } from "lucide-react";

export function ShopHero() {
  return (
    <section className="relative overflow-hidden border-b border-white/[0.07]">

      {/* Background */}

      <div className="absolute inset-0 bg-[#05090f]" />

      {/* Grid */}

      <div
        className="
          primezora-grid
          absolute
          inset-0
          opacity-[0.18]
        "
      />

      {/* Blue glow */}

      <div
        className="
          pointer-events-none
          absolute
          -right-40
          top-1/2
          h-[420px]
          w-[420px]
          -translate-y-1/2
          rounded-full
          bg-blue-600/[0.08]
          blur-[120px]
        "
      />

      {/* Orange glow */}

      <div
        className="
          pointer-events-none
          absolute
          left-[25%]
          bottom-[-180px]
          h-[350px]
          w-[350px]
          rounded-full
          bg-orange-500/[0.035]
          blur-[110px]
        "
      />

      <div className="container-primezora relative">

        <div className="flex min-h-[300px] flex-col justify-center py-16 sm:min-h-[340px]">

          {/* Breadcrumb */}

          <div
            className="
              mb-7
              flex
              items-center
              gap-2
              text-[10px]
              font-medium
              tracking-wide
              text-white/30
            "
          >

            <Link
              href="/"
              className="transition hover:text-white/70"
            >
              Home
            </Link>

            <ChevronRight
              size={12}
              className="text-white/15"
            />

            <span className="text-orange-400">
              Shop
            </span>

          </div>


          {/* Eyebrow */}

          <div
            className="
              mb-4
              flex
              items-center
              gap-3
              text-[9px]
              font-semibold
              uppercase
              tracking-[0.3em]
              text-orange-400
            "
          >

            <span className="h-px w-7 bg-orange-500" />

            Primezora Store

          </div>


          {/* Heading */}

          <h1
            className="
              max-w-3xl
              text-4xl
              font-black
              uppercase
              leading-[0.95]
              tracking-[-0.04em]

              sm:text-5xl

              lg:text-6xl
            "
          >
            Find the right
            <br />

            <span className="text-orange-400">
              gear for your setup.
            </span>
          </h1>


          {/* Description */}

          <p
            className="
              mt-6
              max-w-lg
              text-sm
              leading-6
              text-white/40
            "
          >
            Explore computer components, gaming gear,
            peripherals and accessories from trusted
            technology brands.
          </p>


          {/* Stats */}

          <div className="mt-8 flex flex-wrap gap-7">

            <div>
              <p className="text-lg font-bold text-white">
                100+
              </p>

              <p className="mt-1 text-[9px] uppercase tracking-wider text-white/25">
                Products
              </p>
            </div>

            <div className="h-8 w-px bg-white/[0.08]" />

            <div>
              <p className="text-lg font-bold text-white">
                20+
              </p>

              <p className="mt-1 text-[9px] uppercase tracking-wider text-white/25">
                Brands
              </p>
            </div>

            <div className="h-8 w-px bg-white/[0.08]" />

            <div>
              <p className="text-lg font-bold text-white">
                Islandwide
              </p>

              <p className="mt-1 text-[9px] uppercase tracking-wider text-white/25">
                Delivery
              </p>
            </div>

          </div>

        </div>

      </div>

    </section>
  );
}