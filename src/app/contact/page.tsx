import Link from "next/link";

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[#05090f] px-4 py-16 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl rounded-3xl border border-white/10 bg-[#080b0d] p-8 sm:p-10">
        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-orange-400/80">
          Contact us
        </p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-white">
          Let’s help you find the right setup.
        </h1>

        <div className="mt-8 grid gap-8 md:grid-cols-2">
          <div className="space-y-4 text-sm text-white/65">
            <p>Phone: +94 11 234 5678</p>
            <p>Email: hello@primezora.com</p>
            <p>Address: Colombo, Sri Lanka</p>
          </div>

          <form className="space-y-4">
            <input
              type="text"
              placeholder="Your name"
              className="w-full rounded-md border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-orange-500/40"
            />
            <input
              type="email"
              placeholder="Email address"
              className="w-full rounded-md border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-orange-500/40"
            />
            <textarea
              rows={5}
              placeholder="Your message"
              className="w-full rounded-md border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-orange-500/40"
            />
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md bg-orange-500 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.16em] text-black transition hover:bg-orange-400"
            >
              Send message
            </button>
          </form>
        </div>

        <div className="mt-8">
          <Link
            href="/shop"
            className="text-sm text-orange-400 transition hover:text-orange-300"
          >
            Browse products →
          </Link>
        </div>
      </div>
    </main>
  );
}
