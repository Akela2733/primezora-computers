import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { requireAdminApi } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { validateStorefrontContent } from "@/lib/storefront-content";

export async function PUT(request: Request) {
  const authError = await requireAdminApi();
  if (authError) return authError;

  try {
    const body: unknown = await request.json();
    if (
      typeof body !== "object" ||
      body === null ||
      !("content" in body) ||
      !validateStorefrontContent(body.content)
    ) {
      return NextResponse.json(
        { error: "Storefront content is invalid or contains an unsupported link." },
        { status: 400 }
      );
    }

    const encodedSize = new TextEncoder().encode(
      JSON.stringify(body.content)
    ).length;
    if (encodedSize > 250_000) {
      return NextResponse.json(
        { error: "Storefront content exceeds the 250 KB limit." },
        { status: 413 }
      );
    }

    await prisma.storefrontContent.upsert({
      where: { key: "storefront" },
      create: { key: "storefront", content: body.content },
      update: { content: body.content },
    });
    revalidatePath("/", "layout");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("UPDATE STOREFRONT CONTENT ERROR:", error);
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Invalid JSON storefront content." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update storefront content." },
      { status: 500 }
    );
  }
}
