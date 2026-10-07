"use client";

import { Search } from "lucide-react";

type SearchBarProps = {
  className?: string;
  placeholder?: string;
};

export function SearchBar({
  className = "",
  placeholder = "Search products...",
}: SearchBarProps) {
  return (
    <form
      action="/search"
      method="GET"
      className={`relative ${className}`}
    >
      <Search
        size={16}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/35"
      />

      <input
        type="search"
        name="q"
        placeholder={placeholder}
        autoComplete="off"
        className="h-10 w-full border border-white/10 bg-white/[0.04] pl-10 pr-4 text-xs text-white outline-none transition placeholder:text-white/30 focus:border-orange-500/50 focus:bg-white/[0.06]"
      />
    </form>
  );
}