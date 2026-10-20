import { connection } from "next/server";

import { Hero } from "@/components/home/Hero";
import { ShopCategories } from "@/components/home/ShopCategories";
import BuildPCBanner from "@/components/home/BuildPCBanner";
import { WhyPrimezora } from "@/components/home/WhyPrimezora";
import { TrustedBrands } from "@/components/home/TrustedBrands";

export default async function Home() {
  await connection();

  return (
    <main className="min-h-screen">
      <Hero />
      <ShopCategories />
      <BuildPCBanner />
      <WhyPrimezora />
      <TrustedBrands />
    </main>
  );
}