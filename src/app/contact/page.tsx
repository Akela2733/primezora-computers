import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Clock3,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
} from "lucide-react";

import { ContactForm } from "@/components/contact/ContactForm";
import { getStorefrontContent } from "@/lib/storefront-content";

const faqs = [
  {
    question: "Do your products come with a warranty?",
    answer:
      "Warranty coverage can vary by product. Send us the product link and our team will confirm the available coverage.",
  },
  {
    question: "What are my delivery options?",
    answer:
      "Contact us with your delivery location and the items you’re interested in, and we’ll confirm the available options.",
  },
  {
    question: "Can I return or exchange a product?",
    answer:
      "Get in touch before returning an item. We’ll help you understand the options that apply to your purchase.",
  },
  {
    question: "Do you build custom PCs?",
    answer:
      "Yes, our team can help you plan a setup around your needs. Tell us what you’ll use it for and your preferred budget.",
  },
  {
    question: "How can I track my order?",
    answer:
      "Visit your account’s orders page or contact our team with your order number for help.",
  },
];

export default async function ContactPage() {
  const content = await getStorefrontContent();
  if (!content) return <main className="min-h-screen bg-[#030505]" />;

  const { contact, footer } = content;
  const phoneHref = `tel:${contact.phone.replace(/[^\d+]/g, "")}`;
  const whatsApp = footer.socials.find(({ icon }) => icon === "WhatsApp");

  return (
    <main className="overflow-hidden bg-[#030505] text-white/90">
      <section className="relative isolate border-b border-amber-600/20 bg-[#030505]">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-20 bg-cover bg-[62%_center] md:bg-center"
          style={{
            backgroundImage:
              'url("/banners/about%20banner%201.png")',
          }}
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#030505]/95 via-[#030505]/70 to-[#030505]/15" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#030505]/55 via-transparent to-[#030505]/20" />

        <div className="container-primezora flex min-h-[300px] items-center py-12 sm:min-h-[340px] md:min-h-[360px]">
          <div className="max-w-[440px]">
            <p className="font-display text-[9px] font-semibold uppercase tracking-[0.24em] text-orange-500 sm:text-[10px]">
              {contact.eyebrow}
            </p>
            <h1 className="mt-3 font-display text-[42px] font-bold uppercase leading-[0.95] tracking-[-0.04em] sm:text-6xl">
              Get in
              <br />
              <span className="text-orange-500">touch</span>
            </h1>
            <p className="mt-4 max-w-[360px] text-xs leading-5 text-white/70 sm:text-[13px] sm:leading-6">
              {contact.title} Questions about a product, order, or custom setup?
              We’re here to help.
            </p>
            <a
              href="#contact-form"
              className="group mt-5 inline-flex h-10 items-center gap-5 rounded-md bg-orange-500 px-5 font-display text-[9px] font-bold uppercase tracking-[0.12em] text-[#090909] transition hover:bg-orange-400"
            >
              Send us a message
              <ArrowRight
                size={14}
                className="transition-transform group-hover:translate-x-1"
              />
            </a>
          </div>
        </div>
      </section>

      <section
        aria-label="Contact information and message form"
        className="container-primezora grid gap-6 py-10 sm:py-12 lg:grid-cols-[minmax(215px,0.72fr)_minmax(0,1.8fr)] lg:gap-7 lg:py-14"
      >
        <div className="grid content-start gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <ContactCard
            href={phoneHref}
            icon={<Phone size={20} strokeWidth={1.7} />}
            label="Call us"
            value={contact.phone}
            detail="Speak with our team"
          />
          <ContactCard
            href={`mailto:${contact.email}`}
            icon={<Mail size={20} strokeWidth={1.7} />}
            label="Email us"
            value={contact.email}
            detail="We’ll get back to you as soon as we can"
          />
          <ContactCard
            href={footer.addressHref}
            icon={<MapPin size={21} strokeWidth={1.7} />}
            label="Visit our store"
            value={footer.address}
            detail="Get directions on Google Maps"
            external
          />
          {whatsApp && (
            <ContactCard
              href={whatsApp.href}
              icon={<MessageCircle size={20} strokeWidth={1.7} />}
              label="WhatsApp"
              value="Chat with our team"
              detail="Get a quick answer to your question"
              external
            />
          )}
        </div>

        <section
          id="contact-form"
          className="relative isolate scroll-mt-24 overflow-hidden rounded-lg border border-amber-600/45 bg-[#050606] shadow-[0_18px_60px_rgba(0,0,0,0.25)]"
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-500/80 to-transparent" />
          <div className="grid min-h-full lg:grid-cols-[minmax(0,1fr)_190px]">
            <div className="p-5 sm:p-7 lg:p-8">
              <p className="font-display text-[9px] font-semibold uppercase tracking-[0.2em] text-orange-500">
                Send us a message
              </p>
              <h2 className="mt-2 max-w-lg font-display text-[22px] font-bold uppercase leading-tight sm:text-[26px]">
                {contact.title}
              </h2>
              <p className="mt-2 max-w-lg text-[11px] leading-5 text-white/55 sm:text-xs">
                Fill out the form and our team will get back to you as soon as
                possible.
              </p>
              <div className="mt-5">
                <ContactForm
                  email={contact.email}
                  namePlaceholder={contact.namePlaceholder}
                  emailPlaceholder={contact.emailPlaceholder}
                  messagePlaceholder={contact.messagePlaceholder}
                  sendLabel={contact.sendLabel}
                />
              </div>
            </div>

            <aside className="relative hidden min-h-full overflow-hidden border-l border-amber-600/20 lg:block">
              <Image
                src="/products/headset.jfif"
                alt="Gaming headset"
                width={640}
                height={640}
                className="absolute inset-0 h-full w-full object-cover opacity-55"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#030505] via-[#030505]/20 to-[#030505]/10" />
              <div className="absolute inset-x-0 bottom-0 p-5">
                <Clock3 size={17} className="text-orange-500" />
                <p className="mt-3 font-display text-[11px] font-semibold uppercase leading-5">
                  Here to help
                </p>
                <p className="mt-1 text-[10px] leading-4 text-white/60">
                  From choosing your gear to building your next setup.
                </p>
                {whatsApp && (
                  <a
                    href={whatsApp.href}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-flex items-center gap-2 text-[10px] font-semibold text-orange-400 transition hover:text-orange-300"
                  >
                    Chat on WhatsApp <ArrowRight size={12} />
                  </a>
                )}
              </div>
            </aside>
          </div>
        </section>
      </section>

      <section className="border-y border-white/10 bg-[#050606]">
        <div className="container-primezora grid gap-7 py-10 sm:py-12 lg:grid-cols-[0.8fr_1fr_1fr] lg:items-center lg:gap-6 lg:py-14">
          <div>
            <p className="font-display text-[9px] font-semibold uppercase tracking-[0.2em] text-orange-500">
              Our location
            </p>
            <h2 className="mt-2 font-display text-[26px] font-bold uppercase leading-[1.05] sm:text-3xl">
              Visit our
              <br />
              <span className="text-orange-500">store</span>
            </h2>
            <p className="mt-3 max-w-[300px] text-[11px] leading-5 text-white/60 sm:text-xs">
              Stop by to explore our range of computer and gaming gear, or get
              expert advice from our team.
            </p>
            <a
              href={footer.addressHref}
              target="_blank"
              rel="noreferrer"
              className="group mt-4 inline-flex h-9 items-center gap-3 rounded border border-orange-500/50 px-4 font-display text-[8px] font-semibold uppercase tracking-[0.1em] transition hover:bg-orange-500 hover:text-[#090909]"
            >
              Get directions
              <ArrowRight
                size={12}
                className="text-orange-500 transition group-hover:translate-x-1 group-hover:text-[#090909]"
              />
            </a>
          </div>

          <a
            href={footer.addressHref}
            target="_blank"
            rel="noreferrer"
            aria-label={`Open map for ${footer.address}`}
            className="group relative isolate flex min-h-[210px] items-end overflow-hidden rounded-lg border border-white/10 bg-[#080b0b] p-4 sm:min-h-[240px]"
          >
            <div
              aria-hidden="true"
              className="absolute inset-0 -z-10 opacity-60 [background-image:linear-gradient(rgba(255,255,255,.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.05)_1px,transparent_1px)] [background-size:32px_32px]"
            />
            <svg
              aria-hidden="true"
              viewBox="0 0 400 240"
              className="absolute inset-0 -z-10 h-full w-full"
              preserveAspectRatio="none"
            >
              <path
                d="M-20 195 85 125 150 148 237 67 298 89 421 19M-20 65 76 92 124 36 205 58 265 15M60 260 155 193 224 212 331 123 420 146"
                fill="none"
                stroke="rgba(255,255,255,.12)"
                strokeWidth="12"
              />
              <path
                d="M-20 195 85 125 150 148 237 67 298 89 421 19"
                fill="none"
                stroke="rgba(249,115,22,.55)"
                strokeWidth="2"
                strokeDasharray="7 6"
              />
            </svg>
            <span className="absolute left-1/2 top-[42%] flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-orange-400/50 bg-orange-500/15 text-orange-400 shadow-[0_0_35px_rgba(249,115,22,0.35)] transition group-hover:scale-110">
              <MapPin size={23} />
            </span>
            <span className="relative flex items-center gap-2 rounded border border-white/10 bg-[#030505]/85 px-3 py-2 text-[10px] text-white/75 backdrop-blur">
              <MapPin size={13} className="text-orange-500" />
              {footer.address}
            </span>
          </a>

          <div className="group relative min-h-[210px] overflow-hidden rounded-lg border border-white/10 sm:min-h-[240px]">
            <Image
              src="/banners/banner%204.png"
              alt="Gaming setup at PrimeZora"
              fill
              sizes="(min-width: 1024px) 30vw, 100vw"
              className="object-cover transition duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#030505]/90 via-transparent to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-4">
              <p className="font-display text-[10px] font-semibold uppercase">
                PrimeZora
              </p>
              <p className="mt-1 text-[10px] text-white/65">{footer.address}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="container-primezora grid gap-7 py-10 sm:py-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:gap-12 lg:py-14">
        <div>
          <p className="font-display text-[9px] font-semibold uppercase tracking-[0.2em] text-orange-500">
            Need help?
          </p>
          <h2 className="mt-2 font-display text-[22px] font-bold uppercase leading-tight sm:text-[26px]">
            Frequently asked
            <br />
            <span className="text-orange-500">questions</span>
          </h2>
          <p className="mt-3 max-w-[350px] text-[11px] leading-5 text-white/60 sm:text-xs">
            Find quick answers to common questions about products, delivery,
            returns, and more.
          </p>
          <Link
            href="/contact#contact-form"
            className="group mt-4 inline-flex h-9 items-center gap-3 border border-orange-500/50 px-4 font-display text-[8px] font-semibold uppercase tracking-[0.1em] transition hover:bg-orange-500 hover:text-[#090909]"
          >
            Ask our team
            <ArrowRight
              size={12}
              className="text-orange-500 transition group-hover:translate-x-1 group-hover:text-[#090909]"
            />
          </Link>
        </div>

        <div className="divide-y divide-white/10 overflow-hidden rounded-lg border border-white/10 bg-white/[0.015]">
          {faqs.map(({ question, answer }) => (
            <details key={question} className="group px-4 sm:px-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-3.5 text-[11px] font-medium text-white/85 marker:hidden sm:text-xs [&::-webkit-details-marker]:hidden">
                {question}
                <span
                  aria-hidden="true"
                  className="shrink-0 font-display text-lg leading-none text-orange-500 transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="max-w-2xl pb-4 pr-8 text-[10px] leading-5 text-white/55 sm:text-[11px]">
                {answer}
              </p>
            </details>
          ))}
        </div>
      </section>
    </main>
  );
}

function ContactCard({
  href,
  icon,
  label,
  value,
  detail,
  external = false,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      className="group flex min-h-[86px] items-start gap-3 rounded-md border border-amber-600/25 bg-white/[0.015] p-4 transition hover:border-orange-500/60 hover:bg-orange-500/[0.035]"
    >
      <span className="mt-0.5 shrink-0 text-orange-500 transition group-hover:scale-105">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block font-display text-[8px] font-semibold uppercase tracking-[0.12em] text-orange-400">
          {label}
        </span>
        <span className="mt-1.5 block break-words text-[11px] font-medium text-white/90">
          {value}
        </span>
        <span className="mt-1 block text-[9px] leading-4 text-white/45">
          {detail}
        </span>
      </span>
    </a>
  );
}
