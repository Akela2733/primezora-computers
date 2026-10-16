"use client";

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
    const message = String(formData.get("message") ?? "").trim();
    const subject = encodeURIComponent(`Website enquiry from ${name}`);
    const body = encodeURIComponent(
      `Name: ${name}\nReply email: ${replyEmail}\n\n${message}`
    );

    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        name="name"
        autoComplete="name"
        required
        aria-label={namePlaceholder}
        placeholder={namePlaceholder}
        className="w-full rounded-lg border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-white/90 outline-none placeholder:text-white/35 transition focus:border-amber-600/50"
      />
      <input
        type="email"
        name="email"
        autoComplete="email"
        required
        aria-label={emailPlaceholder}
        placeholder={emailPlaceholder}
        className="w-full rounded-lg border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-white/90 outline-none placeholder:text-white/35 transition focus:border-amber-600/50"
      />
      <textarea
        name="message"
        rows={5}
        required
        aria-label={messagePlaceholder}
        placeholder={messagePlaceholder}
        className="w-full resize-y rounded-lg border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-white/90 outline-none placeholder:text-white/35 transition focus:border-amber-600/50"
      />
      <button
        type="submit"
        className="inline-flex min-h-11 items-center justify-center rounded-lg bg-amber-600 px-5 text-xs font-bold uppercase tracking-[0.12em] text-black transition hover:bg-amber-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500"
      >
        {sendLabel}
      </button>
      <p className="text-xs leading-5 text-white/40">
        Submitting opens a draft in your email app so you can review it before
        sending.
      </p>
    </form>
  );
}
