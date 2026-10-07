import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Mail,
  MapPin,
  Phone,
} from "lucide-react";
import {
  SiFacebook,
  SiTiktok,
  SiWhatsapp,
} from "@icons-pack/react-simple-icons";

const quickLinks: [string, string][] = [
  ["Home", "/"],
  ["Shop", "/shop"],
  ["Categories", "/shop"],
  ["About Us", "/about"],
  ["Contact", "/contact"],
];

const helpLinks: [string, string][] = [
  ["Shipping & Delivery", "/shipping"],
  ["Returns & Refunds", "/returns"],
  ["FAQ", "/faq"],
  ["Terms & Conditions", "/terms"],
  ["Privacy Policy", "/privacy"],
];

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-amber-500/10 bg-[#030607]">
      <div className="primezora-grid pointer-events-none absolute inset-0 opacity-[0.08]" />
      <div className="pointer-events-none absolute inset-y-0 left-0 w-1/2 bg-[radial-gradient(ellipse_at_15%_50%,rgba(207,121,28,0.055),transparent_60%)]" />

      <div className="container-primezora relative">
        <div className="grid items-start gap-7 py-7 sm:grid-cols-2 sm:gap-x-10 lg:grid-cols-[1.35fr_0.8fr_1fr_1.2fr_1.25fr] lg:items-center lg:gap-7 lg:py-8">
          <div>
            <Link href="/" className="inline-flex items-center">
              <Image
                src="/primezora%20new%20logo.png"
                alt="PrimeZora Computer Solutions"
                width={180}
                height={55}
                className="h-10 w-auto object-contain"
              />
            </Link>
            <p className="mt-3 max-w-55 text-[10px] leading-[1.55] text-white/50">
              Your trusted online store for computer and gaming gear. Quality
              products, competitive prices, delivered islandwide.
            </p>
            <div className="mt-3 flex items-center gap-1.5">
              <SocialLink label="Facebook" href="https://www.facebook.com/">
                <SiFacebook size={13} />
              </SocialLink>
              <SocialLink label="TikTok" href="https://www.tiktok.com/">
                <SiTiktok size={13} />
              </SocialLink>
              <SocialLink label="WhatsApp" href="https://wa.me/94771234567">
                <SiWhatsapp size={13} />
              </SocialLink>
              <SocialLink label="Email" href="mailto:support@primezora.lk">
                <Mail size={13} />
              </SocialLink>
            </div>
          </div>
      <FooterColumn title="Quick Links" links={quickLinks} />
          <FooterColumn title="Help" links={helpLinks} />

          <div>
            <FooterHeading>Contact Us</FooterHeading>
            <ul className="mt-3 space-y-2.5">
              <ContactItem icon={<Phone size={12} />} href="tel:+94771234567">
                +94 77 123 4567
              </ContactItem>
              <ContactItem icon={<Mail size={12} />} href="mailto:support@primezora.lk">
                support@primezora.lk
              </ContactItem>
              <ContactItem icon={<MapPin size={12} />} href="https://maps.google.com/?q=Colombo,+Sri+Lanka">
                Colombo, Sri Lanka
              </ContactItem>
            </ul>
          </div>
          <div>
            <FooterHeading>Get Updates</FooterHeading>
            <p className="mt-3 max-w-47.5 text-[9px] leading-[1.55] text-white/45">
              Exclusive deals, new arrivals and gaming news.
            </p>
            <div className="mt-3 flex h-8 max-w-57.5 items-center border border-white/15 bg-white/2.5 pl-2.5 pr-1">
              <input
                type="email"
                aria-label="Your email address"
                placeholder="Your email address"
                className="min-w-0 flex-1 bg-transparent text-[9px] text-white outline-none placeholder:text-white/35"
              />
              <button
                type="button"
                aria-label="Subscribe to updates"
                className="flex h-6 w-7 shrink-0 items-center justify-center text-amber-400 transition hover:bg-amber-500/10 hover:text-amber-200"
              >
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-amber-500/10 py-3 text-[8px] text-white/35 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Primezora Technologies. All rights reserved.</p>
          <p>
            Powered by <span className="text-white/60">Passion</span>
            <span className="px-2 text-amber-500/70">/</span>
            Built for Gamers
          </p>
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
  links: [string, string][];
}) {
  return (
    <div>
      <FooterHeading>{title}</FooterHeading>
      <ul className="mt-3 space-y-1.5">
        {links.map(([label, href]) => (
          <li key={label}>
            <Link href={href} className="text-[9px] text-white/45 transition hover:text-amber-300">
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
      <Link href={href} className="flex items-center gap-2 text-[9px] text-white/45 transition hover:text-amber-300">
        <span className="shrink-0 text-amber-500/80">{icon}</span>
        {children}
      </Link>
    </li>
  );
}

function SocialLink({
  label,
  href,
  children,
}: {
  label: string;
  href: string;
  children: React.ReactNode;
}) {
  const isExternal = href.startsWith("https://");

  return (
    <a
      href={href}
      aria-label={label}
      title={label}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noreferrer" : undefined}
      className="flex h-6 w-6 items-center justify-center rounded-sm text-white/60 transition hover:bg-amber-500/10 hover:text-amber-300"
    >
      {children}
    </a>
  );
}
