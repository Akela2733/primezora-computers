import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Mail, MapPin, Phone } from "lucide-react";
import {
  SiFacebook,
  SiTiktok,
  SiWhatsapp,
} from "@icons-pack/react-simple-icons";
import { getStorefrontContent } from "@/lib/storefront-content";

export async function Footer() {
  const content = await getStorefrontContent();
  if (!content) return null;

  const { brand, footer } = content;

  return (
    <footer className="relative overflow-hidden border-t border-amber-600/10 bg-[#030505]">
      <div className="primezora-grid pointer-events-none absolute inset-0 opacity-[0.08]" />
      <div className="pointer-events-none absolute inset-y-0 left-0 w-1/2 bg-[radial-gradient(ellipse_at_15%_50%,rgba(217,119,6,0.055),transparent_60%)]" />

      <div className="container-primezora relative">
        <div className="grid items-start gap-7 py-7 sm:grid-cols-2 sm:gap-x-10 lg:grid-cols-[1.35fr_0.8fr_1fr_1.2fr_1.25fr] lg:items-center lg:gap-7 lg:py-8">
          <div>
            <Link href="/" className="inline-flex items-center">
              <Image
                src={brand.logo}
                alt={brand.logoAlt}
                width={220}
                height={68}
                unoptimized
                className="h-14 w-auto object-contain sm:h-16"
              />
            </Link>
            <p className="mt-4 max-w-64 text-sm leading-6 text-white/55">
              {footer.description}
            </p>
            <div className="mt-4 flex items-center gap-2">
              {footer.socials.map((social) => (
                <SocialLink
                  key={social.label}
                  label={social.label}
                  href={social.href}
                  icon={social.icon}
                />
              ))}
            </div>
          </div>

          <FooterColumn title={footer.quickLinksTitle} links={footer.quickLinks} />
          <FooterColumn title={footer.helpLinksTitle} links={footer.helpLinks} />

          <div>
            <FooterHeading>{footer.contactTitle}</FooterHeading>
            <ul className="mt-4 space-y-3">
              <ContactItem icon={<Phone size={14} />} href={footer.phoneHref}>
                {footer.phone}
              </ContactItem>
              <ContactItem icon={<Mail size={14} />} href={footer.emailHref}>
                {footer.email}
              </ContactItem>
              <ContactItem icon={<MapPin size={14} />} href={footer.addressHref}>
                {footer.address}
              </ContactItem>
            </ul>
          </div>

          <div>
            <FooterHeading>{footer.updatesTitle}</FooterHeading>
            <p className="mt-4 max-w-64 text-sm leading-6 text-white/55">
              {footer.updatesDescription}
            </p>
            <div className="mt-4 flex h-10 max-w-64 items-center border border-white/15 bg-white/2.5 pl-3 pr-1">
              <input
                type="email"
                aria-label={footer.updatesEmailPlaceholder}
                placeholder={footer.updatesEmailPlaceholder}
                className="min-w-0 flex-1 bg-transparent text-sm text-white/90 outline-none placeholder:text-white/45"
              />
              <button
                type="button"
                aria-label={footer.subscribeLabel}
                className="flex h-8 w-9 shrink-0 items-center justify-center text-amber-600 transition hover:bg-amber-600/10 hover:text-amber-600"
              >
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-amber-600/10 py-4 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <p>{footer.copyright}</p>
          <p>{footer.tagline}</p>
        </div>
      </div>
    </footer>
  );
}

function FooterHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-display text-xs font-semibold uppercase tracking-[0.12em] text-white/85">
      {children}
    </h2>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <FooterHeading>{title}</FooterHeading>
      <ul className="mt-4 space-y-2.5">
        {links.map(({ label, href }) => (
          <li key={`${label}-${href}`}>
            <Link
              href={href}
              className="text-sm leading-6 text-white/55 transition hover:text-amber-600"
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ContactItem({
  icon,
  href,
  children,
}: {
  icon: React.ReactNode;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <li>
      <Link
        href={href}
        className="flex items-start gap-2 text-sm leading-6 text-white/55 transition hover:text-amber-600"
      >
        <span className="mt-1 shrink-0 text-amber-600/80">{icon}</span>
        {children}
      </Link>
    </li>
  );
}

function SocialLink({
  label,
  href,
  icon,
}: {
  label: string;
  href: string;
  icon: string;
}) {
  const isExternal = href.startsWith("https://");
  const iconElement = {
    Facebook: <SiFacebook size={13} />,
    TikTok: <SiTiktok size={13} />,
    WhatsApp: <SiWhatsapp size={13} />,
    Email: <Mail size={13} />,
  }[icon];

  if (!iconElement) {
    throw new Error(`Unknown storefront social icon: ${icon}`);
  }

  return (
    <a
      href={href}
      aria-label={label}
      title={label}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noreferrer" : undefined}
      className="flex h-9 w-9 items-center justify-center rounded-md text-white/65 transition hover:bg-amber-600/10 hover:text-amber-600"
    >
      {iconElement}
    </a>
  );
}
