"use client";

import {
  ArrowRight,
  ChevronDown,
  Mail,
  MessageSquare,
  Phone,
  UserRound,
} from "lucide-react";

type ContactFormProps = {
  email: string;
  namePlaceholder: string;
  emailPlaceholder: string;
  messagePlaceholder: string;
  sendLabel: string;
};

export function ContactForm({
  email,
  namePlaceholder,
  emailPlaceholder,
  messagePlaceholder,
  sendLabel,
}: ContactFormProps) {
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "").trim();
    const replyEmail = String(formData.get("email") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();
    const topic = String(formData.get("subject") ?? "").trim();
    const message = String(formData.get("message") ?? "").trim();
    const subject = encodeURIComponent(
      `${topic} enquiry from ${name}`
    );
    const body = encodeURIComponent(
      `Name: ${name}\nReply email: ${replyEmail}\nPhone: ${phone || "Not provided"}\nSubject: ${topic}\n\n${message}`
    );

    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2.5">
      <label className="relative block">
        <UserRound
          size={13}
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/45"
        />
        <input
          type="text"
          name="name"
          autoComplete="name"
          required
          aria-label={namePlaceholder}
          placeholder={namePlaceholder}
          className="h-10 w-full rounded-full border border-white/[0.09] bg-white/[0.025] pl-9 pr-4 text-[11px] text-white/90 outline-none placeholder:text-white/45 transition focus:border-orange-500/60 focus:bg-white/[0.04]"
        />
      </label>
      <label className="relative block">
        <Mail
          size={13}
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/45"
        />
        <input
          type="email"
          name="email"
          autoComplete="email"
          required
          aria-label={emailPlaceholder}
          placeholder={emailPlaceholder}
          className="h-10 w-full rounded-full border border-white/[0.09] bg-white/[0.025] pl-9 pr-4 text-[11px] text-white/90 outline-none placeholder:text-white/45 transition focus:border-orange-500/60 focus:bg-white/[0.04]"
        />
      </label>
      <label className="relative block">
        <Phone
          size={13}
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/45"
        />
        <input
          type="tel"
          name="phone"
          autoComplete="tel"
          aria-label="Phone number (optional)"
          placeholder="Phone number (optional)"
          className="h-10 w-full rounded-full border border-white/[0.09] bg-white/[0.025] pl-9 pr-4 text-[11px] text-white/90 outline-none placeholder:text-white/45 transition focus:border-orange-500/60 focus:bg-white/[0.04]"
        />
      </label>
      <label className="relative block">
        <MessageSquare
          size={13}
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/45"
        />
        <select
          name="subject"
          required
          defaultValue=""
          aria-label="Select subject"
          className="h-10 w-full appearance-none rounded-full border border-white/[0.09] bg-[#080a0a] pl-9 pr-9 text-[11px] text-white/75 outline-none transition focus:border-orange-500/60"
        >
          <option value="" disabled>
            Select subject
          </option>
          <option value="Product question">Product question</option>
          <option value="Order support">Order support</option>
          <option value="Custom PC build">Custom PC build</option>
          <option value="Warranty and returns">Warranty and returns</option>
          <option value="Other">Other</option>
        </select>
        <ChevronDown
          size={13}
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/45"
        />
      </label>
      <label className="relative block">
        <MessageSquare
          size={13}
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-3 text-white/45"
        />
        <textarea
          name="message"
          rows={4}
          required
          aria-label={messagePlaceholder}
          placeholder={messagePlaceholder}
          className="min-h-[100px] w-full resize-y rounded-xl border border-white/[0.09] bg-white/[0.025] py-3 pl-9 pr-4 text-[11px] text-white/90 outline-none placeholder:text-white/45 transition focus:border-orange-500/60 focus:bg-white/[0.04]"
        />
      </label>
      <button
        type="submit"
        className="group inline-flex min-h-10 items-center justify-center gap-4 rounded-md bg-orange-500 px-5 font-display text-[9px] font-bold uppercase tracking-[0.12em] text-[#090909] transition hover:bg-orange-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500"
      >
        {sendLabel}
        <ArrowRight
          size={14}
          className="transition-transform group-hover:translate-x-1"
        />
      </button>
      <p className="text-[9px] leading-4 text-white/40">
        This opens a draft in your email app so you can review it before sending.
      </p>
    </form>
  );
}
