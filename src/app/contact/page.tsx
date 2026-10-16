import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";

import { ContactForm } from "@/components/contact/ContactForm";
import { getStorefrontContent } from "@/lib/storefront-content";

export default async function ContactPage() {
  const content = await getStorefrontContent();
  if (!content) return <main className="min-h-screen bg-[#030505]" />;

  const contact = content.contact;
  const phoneHref = `tel:${contact.phone.replace(/[^\d+]/g, "")}`;
  const mapHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contact.address)}`;

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-[#030505] px-4 py-14 text-white/90 sm:px-6 sm:py-20 lg:px-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_90%_10%,rgba(217,119,6,0.1),transparent_36%)]"
      />

      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <p className="font-display text-[10px] font-semibold uppercase tracking-[0.24em] text-amber-600">
            {contact.eyebrow}
          </p>
          <h1 className="mt-4 font-display text-4xl font-bold uppercase leading-tight tracking-tight text-white sm:text-5xl">
            {contact.title}
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-white/55">
            Questions about a product, order, or finding the right setup? Get in
            touch with our team.
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:gap-8">
          <section aria-label="Contact information" className="space-y-4">
            <a
              href={phoneHref}
              className="group flex items-start gap-4 rounded-2xl border border-white/[0.09] bg-white/[0.02] p-5 transition hover:border-amber-600/30 hover:bg-amber-600/[0.025]"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-amber-600/20 bg-amber-600/[0.07] text-amber-600">
                <Phone size={18} />
              </span>
              <span>
                <span className="block text-xs font-semibold uppercase tracking-[0.12em] text-white/45">
                  Call us
                </span>
                <span className="mt-2 block text-sm text-white/85 transition group-hover:text-amber-500">
                  {contact.phone}
                </span>
              </span>
            </a>

            <a
              href={`mailto:${contact.email}`}
              className="group flex items-start gap-4 rounded-2xl border border-white/[0.09] bg-white/[0.02] p-5 transition hover:border-amber-600/30 hover:bg-amber-600/[0.025]"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-amber-600/20 bg-amber-600/[0.07] text-amber-600">
                <Mail size={18} />
              </span>
              <span>
                <span className="block text-xs font-semibold uppercase tracking-[0.12em] text-white/45">
                  Email us
                </span>
                <span className="mt-2 block break-all text-sm text-white/85 transition group-hover:text-amber-500">
                  {contact.email}
                </span>
              </span>
            </a>

            <a
              href={mapHref}
              target="_blank"
              rel="noreferrer"
              className="group flex items-start gap-4 rounded-2xl border border-white/[0.09] bg-white/[0.02] p-5 transition hover:border-amber-600/30 hover:bg-amber-600/[0.025]"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-amber-600/20 bg-amber-600/[0.07] text-amber-600">
                <MapPin size={18} />
              </span>
              <span>
                <span className="block text-xs font-semibold uppercase tracking-[0.12em] text-white/45">
                  Find us
                </span>
                <span className="mt-2 block text-sm text-white/85 transition group-hover:text-amber-500">
                  {contact.address}
                </span>
              </span>
            </a>

            <Link
              href={contact.browseHref}
              className="inline-flex min-h-11 items-center px-1 text-sm font-medium text-amber-500 transition hover:text-amber-400"
            >
              {contact.browseLabel}
            </Link>
          </section>

          <section className="rounded-2xl border border-white/[0.09] bg-white/[0.02] p-6 sm:p-8">
            <h2 className="font-display text-lg font-semibold text-white/90">
              Send us a message
            </h2>
            <p className="mt-2 text-sm leading-6 text-white/50">
              Fill in the details and we’ll prepare an email for you to review
              and send.
            </p>
            <div className="mt-6">
              <ContactForm
                email={contact.email}
                namePlaceholder={contact.namePlaceholder}
                emailPlaceholder={contact.emailPlaceholder}
                messagePlaceholder={contact.messagePlaceholder}
                sendLabel={contact.sendLabel}
              />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
