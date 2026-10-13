import Link from "next/link";
import { getStorefrontContent } from "@/lib/storefront-content";

export default async function AboutPage() {
  const content = await getStorefrontContent();
  if (!content) return <main className="min-h-screen bg-[#030505]" />;

  const about = content.about;

  return (
    <main className="min-h-screen bg-[#030505] px-4 py-16 text-white/90 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-amber-600/80">
          {about.eyebrow}
        </p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-white/90">
          {about.title}
        </h1>
        <p className="mt-6 max-w-2xl whitespace-pre-line text-base leading-7 text-white/60">
          {about.description}
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {about.features.map((feature, index) => (
            <div
              key={`${feature.title}-${index}`}
              className="rounded-2xl border border-white/10 bg-[#030505] p-6"
            >
              <h2 className="text-lg font-semibold text-white/90">
                {feature.title}
              </h2>
              <p className="mt-3 text-sm leading-6 text-white/55">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-10">
          <Link
            href={about.actionHref}
            className="inline-flex items-center justify-center rounded-md bg-amber-600 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.16em] text-black transition hover:bg-amber-600"
          >
            {about.actionLabel}
          </Link>
        </div>
      </div>
    </main>
  );
}
