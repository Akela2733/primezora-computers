import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#05090f] px-4 py-16 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-orange-400/80">
          About Primezora
        </p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-white">
          Built for performance-driven setups.
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-7 text-white/60">
          Primezora Technologies helps gamers, creators, and businesses find the right hardware
          for reliable speed, precision, and everyday performance. From PC components to
          peripherals and accessories, we curate products that deliver real value.
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {[
            ["Expert curation", "Every product is selected for quality, compatibility, and customer value."],
            ["Fast local support", "We help customers choose the right setup for their workflows and goals."],
            ["Trusted delivery", "We keep your order process simple from browsing to checkout."],
          ].map(([title, description]) => (
            <div key={title} className="rounded-2xl border border-white/10 bg-[#080b0d] p-6">
              <h2 className="text-lg font-semibold text-white">{title}</h2>
              <p className="mt-3 text-sm leading-6 text-white/55">{description}</p>
            </div>
          ))}
        </div>

        <div className="mt-10">
          <Link
            href="/shop"
            className="inline-flex items-center justify-center rounded-md bg-orange-500 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.16em] text-black transition hover:bg-orange-400"
          >
            Explore the store
          </Link>
        </div>
      </div>
    </main>
  );
}
