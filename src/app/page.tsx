import { Hero } from "@/components/home/Hero";
import { ShopCategories } from "@/components/home/ShopCategories";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { BuildPCBanner } from "@/components/home/BuildPCBanner";
import { WhyPrimezora } from "@/components/home/WhyPrimezora";
import { TrustedBrands } from "@/components/home/TrustedBrands";

export default function Home() {
  return (
    <main className="min-h-screen">

      {/* <section className="container-primezora py-32">

        <p className="text-xs uppercase tracking-[0.3em] text-blue-400">
          Primezora Technologies
        </p>

        <h1 className="mt-4 text-5xl font-black tracking-tight">
          BUILD YOUR{" "}
          <span className="primezora-gradient-text">
            NEXT LEVEL.
          </span>
        </h1>

        <p className="mt-6 max-w-xl text-white/45">
          PC components, gaming accessories and
          technology products delivered islandwide
          across Sri Lanka.
        </p>

      </section> */}
<Hero />
<ShopCategories />
<FeaturedProducts />
<BuildPCBanner/>
<WhyPrimezora />
<TrustedBrands />

    </main>
  );
}