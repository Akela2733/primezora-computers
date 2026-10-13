import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { requireAdminPage } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import ContentEditor from "./ContentEditor";

export const dynamic = "force-dynamic";

export default async function AdminContentPage() {
  await requireAdminPage("/admin/content");
  const record = await prisma.storefrontContent.findUnique({
    where: { key: "storefront" },
    select: { content: true, updatedAt: true },
  });

  return (
    <main className="min-h-screen bg-[#030505] text-white/90">
      <section className="border-b border-white/[0.06]">
        <div className="container-primezora py-8">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.18em] text-white/35 transition hover:text-amber-600"
          >
            <ArrowLeft size={13} />
            Admin Dashboard
          </Link>
          <h1 className="mt-7 font-display text-3xl font-bold uppercase">
            Storefront Content
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/45">
            Edit the database-backed homepage, about, contact, branding and footer
            content as JSON. Image fields accept site paths or HTTPS URLs; links
            accept site paths, HTTPS, email and telephone URLs.
          </p>
          {record && (
            <p className="mt-2 text-[10px] text-white/30">
              Last updated {record.updatedAt.toLocaleString()}
            </p>
          )}
        </div>
      </section>

      <section className="container-primezora py-8">
        <ContentEditor
          initialContent={JSON.stringify(record?.content ?? {}, null, 2)}
        />
      </section>
    </main>
  );
}
