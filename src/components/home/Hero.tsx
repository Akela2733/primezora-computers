import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CreditCard, ShieldCheck, Truck } from "lucide-react";

const benefits = [
  {
    icon: Truck,
    title: "Islandwide Delivery",
    subtitle: "Across Sri Lanka",
  },
  {
    icon: ShieldCheck,
    title: "Genuine Products",
    subtitle: "Trusted brands",
  },
  {
    icon: CreditCard,
    title: "Secure Checkout",
    subtitle: "COD / Bank / Online",
  },
];

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-[#030505] text-white">
      <Image
        src="/banners/hero-background.png"
        alt="Amber-lit gaming PC setup with monitor, keyboard, and headset"
        fill
        priority
        sizes="100vw"
        className="object-cover object-[68%_center] sm:object-center"
      />
      <div className="absolute inset-0 bg-linear-to-r from-[#030505]/85 via-[#030505]/55 to-[#030505]/5" />
      <div className="absolute inset-0 bg-linear-to-t from-[#030505]/70 via-transparent to-[#030505]/10" />
      <div className="absolute inset-0 bg-[#030505]/10 sm:bg-transparent" />

      <div className="container-primezora relative flex min-h-[720px] flex-col justify-between gap-12 pb-7 pt-20 sm:min-h-[680px] sm:pt-24 lg:min-h-[min(760px,calc(100svh-120px))] lg:pt-24">
        <div className="max-w-[570px]">
          <p className="mb-5 font-display text-[9px] font-semibold uppercase tracking-[0.3em] text-amber-300/80 sm:text-[10px]">
            Build <span className="px-2 text-amber-600">/</span> Game{" "}
            <span className="px-2 text-amber-600">/</span> Upgrade
          </p>

          <h1 className="font-display text-[38px] font-bold uppercase leading-[1.08] text-white sm:text-6xl lg:text-[64px]">
            Your One Stop
            <br />
            <span className="text-[#f49a32]">Tech &amp; Gaming</span>
            <br />
            Store
          </h1>

          <p className="mt-5 max-w-[390px] text-sm leading-6 text-white/70 sm:text-base">
            Premium computer accessories, gaming gear, PC parts and more, built
            for performance and delivered islandwide.
          </p>

          <Link
            href="/shop"
            className="group mt-7 inline-flex h-11 items-center gap-3 border border-[#e88720]/80 bg-black/20 px-5 font-display text-[10px] font-semibold uppercase tracking-[0.1em] text-white transition hover:bg-[#e88720] hover:text-[#100a03]"
          >
            Shop Now
            <ArrowRight size={15} className="text-[#f49a32] transition-transform group-hover:translate-x-1 group-hover:text-[#100a03]" />
          </Link>
        </div>

        <div className="grid max-w-[760px] grid-cols-1 border-t border-white/15 pt-4 sm:grid-cols-3 sm:pt-5">
          {benefits.map(({ icon: Icon, title, subtitle }, index) => (
            <div
              key={title}
              className={`flex items-center gap-3 py-2 sm:py-0 sm:pr-5 ${
                index > 0 ? "sm:border-l sm:border-white/10 sm:pl-5" : ""
              }`}
            >
              <Icon size={21} className="shrink-0 text-[#e88720]" strokeWidth={1.8} />
              <div>
                <p className="font-display text-[10px] font-semibold text-white/90 sm:text-[11px]">
                  {title}
                </p>
                <p className="mt-0.5 text-[10px] text-white/50">{subtitle}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
