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
                width={180}
                height={55}
                unoptimized
                className="h-10 w-auto object-contain"
              />
            </Link>
            <p className="mt-3 max-w-55 text-[10px] leading-[1.55] text-white/50">
              {footer.description}
            </p>
            <div className="mt-3 flex items-center gap-1.5">
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
            <ul className="mt-3 space-y-2.5">
              <ContactItem icon={<Phone size={12} />} href={footer.phoneHref}>
                {footer.phone}
              </ContactItem>
              <ContactItem icon={<Mail size={12} />} href={footer.emailHref}>
                {footer.email}
              </ContactItem>
              <ContactItem icon={<MapPin size={12} />} href={footer.addressHref}>
                {footer.address}
              </ContactItem>
            </ul>
          </div>

          <div>
            <FooterHeading>{footer.updatesTitle}</FooterHeading>
            <p className="mt-3 max-w-47.5 text-[9px] leading-[1.55] text-white/45">
              {footer.updatesDescription}
            </p>
            <div className="mt-3 flex h-8 max-w-57.5 items-center border border-white/15 bg-white/2.5 pl-2.5 pr-1">
              <input
                type="email"
                aria-label={footer.updatesEmailPlaceholder}
                placeholder={footer.updatesEmailPlaceholder}
                className="min-w-0 flex-1 bg-transparent text-[9px] text-white/90 outline-none placeholder:text-white/35"
              />
              <button
                type="button"
                aria-label={footer.subscribeLabel}
                className="flex h-6 w-7 shrink-0 items-center justify-center text-amber-600 transition hover:bg-amber-600/10 hover:text-amber-600"
              >
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-amber-600/10 py-3 text-[8px] text-white/35 sm:flex-row sm:items-center sm:justify-between">
          <p>{footer.copyright}</p>
          <p>{footer.tagline}</p>
        </div>
      </div>
    </footer>
  );
}

function FooterHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-display text-[8px] font-semibold uppercase tracking-[0.12em] text-white/85">
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
      <ul className="mt-3 space-y-1.5">
        {links.map(({ label, href }) => (
          <li key={`${label}-${href}`}>
            <Link
              href={href}
              className="text-[9px] text-white/45 transition hover:text-amber-600"
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
        className="flex items-center gap-2 text-[9px] text-white/45 transition hover:text-amber-600"
      >
        <span className="shrink-0 text-amber-600/80">{icon}</span>
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
      className="flex h-6 w-6 items-center justify-center rounded-sm text-white/60 transition hover:bg-amber-600/10 hover:text-amber-600"
    >
      {iconElement}
    </a>
  );
}
