"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShieldCheck,
  Package,
  Layers,
  ShoppingBag,
  Users,
  LayoutDashboard,
  ExternalLink,
} from "lucide-react";
import AdminLogoutButton from "./AdminLogoutButton";

const NAV_ITEMS = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/inventory", label: "Inventory", icon: Layers },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/customers", label: "Customers", icon: Users },
];

export function AdminHeaderBar() {
  const pathname = usePathname();

  return (
    <header className="border-b border-white/[0.08] bg-[#04070c]/90 backdrop-blur-md sticky top-0 z-40">
      <div className="container-primezora flex h-14 items-center justify-between gap-4">
        {/* Left: Brand & Badge */}
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="flex items-center gap-2 group"
          >
            <div className="flex h-7 w-7 items-center justify-center border border-orange-500/30 bg-orange-500/10 text-orange-400 group-hover:border-orange-500/60 transition">
              <ShieldCheck size={14} />
            </div>
            <span className="font-display text-[10px] font-bold uppercase tracking-[0.25em] text-white">
              Primezora <span className="text-orange-400">Admin</span>
            </span>
          </Link>

          <span className="hidden md:inline-block h-4 w-px bg-white/10" />

          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:inline-flex items-center gap-1.5 text-[9px] uppercase tracking-[0.16em] text-white/40 hover:text-white transition"
          >
            <span>Live Store</span>
            <ExternalLink size={10} />
          </Link>
        </div>

        {/* Center: Quick navigation links */}
        <nav className="hidden lg:flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.15em] transition border ${
                  isActive
                    ? "border-orange-500/40 bg-orange-500/10 text-orange-400"
                    : "border-transparent text-white/45 hover:text-white hover:border-white/10"
                }`}
              >
                <Icon size={12} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right: User Status & Logout */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 border border-white/[0.06] bg-white/[0.02] px-2.5 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[9px] uppercase tracking-[0.15em] text-white/50">
              Admin Session
            </span>
          </div>

          <AdminLogoutButton compact />
        </div>
      </div>
    </header>
  );
}

export default AdminHeaderBar;
