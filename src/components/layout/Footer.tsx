import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Mail } from "lucide-react";
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
    <footer className="relative overflow-hidden border-t border-white/10 bg-[#030505]">
      <div className="primezora-grid pointer-events-none absolute inset-0 opacity-[0.04]" />
      <div className="pointer-events-none absolute inset-y-0 left-0 w-28 bg-[linear-gradient(135deg,rgba(249,115,22,0.22),transparent_42%)] [clip-path:polygon(0_0,100%_0,0_100%)] sm:w-40" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-36 bg-[linear-gradient(315deg,rgba(249,115,22,0.2),transparent_48%)] [clip-path:polygon(100%_0,100%_100%,0_100%)] sm:w-56" />

      <div className="container-primezora relative">
        <div className="grid items-start gap-7 py-7 sm:grid-cols-2 sm:gap-x-10 md:grid-cols-[1.4fr_0.55fr_0.55fr_1.5fr] md:gap-6 md:py-6 lg:grid-cols-[1.5fr_0.55fr_0.65fr_1.45fr] lg:gap-10 lg:py-7">
          <div className="min-w-0">
            <Link href="/" className="inline-flex items-center">
              <span className="relative block h-8 w-32 overflow-hidden">
                <Image
                  src={brand.logo}
                  alt={brand.logoAlt}
                  width={128}
                  height={128}
                  unoptimized
                  className="absolute left-0 top-[-44px] h-32 w-32 max-w-none object-contain"
                />
              </span>
            </Link>
          </div>

          <FooterColumn title={footer.quickLinksTitle} links={footer.quickLinks} />
          <FooterColumn title="Support" links={footer.helpLinks} />

          <div className="min-w-0">
            <FooterHeading>{footer.updatesTitle}</FooterHeading>
            <p className="mt-2 max-w-64 text-[10px] leading-4 text-white/55">
              {footer.updatesDescription}
            </p>
            <div className="mt-3 flex h-8 max-w-64 items-center border border-white/15 bg-white/2.5 pl-3 pr-1">
              <input
                type="email"
                aria-label={footer.updatesEmailPlaceholder}
                placeholder={footer.updatesEmailPlaceholder}
                className="min-w-0 flex-1 bg-transparent text-[10px] text-white/90 outline-none placeholder:text-white/45"
              />
              <button
                type="button"
                aria-label={footer.subscribeLabel}
                className="flex h-6 w-7 shrink-0 items-center justify-center rounded bg-orange-500 text-[#090909] transition hover:bg-orange-400"
              >
                <ArrowRight size={13} />
              </button>
            </div>
            <div className="mt-2 flex items-center gap-1">
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
        </div>

        <div className="flex flex-col gap-2 border-t border-white/10 py-3 text-[9px] text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <p>{footer.copyright}</p>
          <p>{footer.tagline}</p>
        </div>
      </div>
    </footer>
  );
}

function FooterHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-display text-[9px] font-semibold text-white/85">
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
    <div className="min-w-0">
      <FooterHeading>{title}</FooterHeading>
      <ul className="mt-2 space-y-1">
        {links.map(({ label, href }) => (
          <li key={`${label}-${href}`}>
            <Link
              href={href}
              className="text-[10px] leading-4 text-white/55 transition hover:text-orange-400"
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
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
    Facebook: <SiFacebook size={11} />,
    TikTok: <SiTiktok size={11} />,
    WhatsApp: <SiWhatsapp size={11} />,
    Email: <Mail size={11} />,
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
      className="flex h-6 w-6 items-center justify-center rounded text-white/65 transition hover:bg-orange-500/10 hover:text-orange-400"
    >
      {iconElement}
    </a>
  );
}
