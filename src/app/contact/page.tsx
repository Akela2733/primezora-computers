import Link from "next/link";
import { getStorefrontContent } from "@/lib/storefront-content";

export default async function ContactPage() {
  const content = await getStorefrontContent();
  if (!content) return <main className="min-h-screen bg-[#030505]" />;

  const contact = content.contact;

  return (
    <main className="min-h-screen bg-[#030505] px-4 py-16 text-white/90 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl rounded-3xl border border-white/10 bg-[#030505] p-8 sm:p-10">
        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-amber-600/80">
          {contact.eyebrow}
        </p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-white/90">
          {contact.title}
        </h1>

        <div className="mt-8 grid gap-8 md:grid-cols-2">
          <div className="space-y-4 text-sm text-white/65">
            <p>{contact.phone}</p>
            <p>{contact.email}</p>
            <p>{contact.address}</p>
          </div>

          <form className="space-y-4">
            <input
              type="text"
              placeholder={contact.namePlaceholder}
              className="w-full rounded-md border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-white/90 outline-none placeholder:text-white/30 focus:border-amber-600/40"
            />
            <input
              type="email"
              placeholder={contact.emailPlaceholder}
              className="w-full rounded-md border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-white/90 outline-none placeholder:text-white/30 focus:border-amber-600/40"
            />
            <textarea
              rows={5}
              placeholder={contact.messagePlaceholder}
              className="w-full rounded-md border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-white/90 outline-none placeholder:text-white/30 focus:border-amber-600/40"
            />
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md bg-amber-600 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.16em] text-black transition hover:bg-amber-600"
            >
              {contact.sendLabel}
            </button>
          </form>
        </div>

        <div className="mt-8">
          <Link
            href={contact.browseHref}
            className="text-sm text-amber-600 transition hover:text-amber-600"
          >
            {contact.browseLabel}
          </Link>
        </div>
      </div>
    </main>
  );
}
