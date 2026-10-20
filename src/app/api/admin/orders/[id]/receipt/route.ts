import { NextResponse } from "next/server";

import { requireAdminOrdersApi } from "@/lib/admin-orders-auth";
import { prisma } from "@/lib/prisma";
import { downloadPrivatePaymentReceipt } from "@/lib/payment-receipt-storage";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const RECEIPT_CONTENT_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

export async function GET(request: Request, { params }: RouteContext) {
  const authError = await requireAdminOrdersApi();
  if (authError) return authError;

  const { id } = await params;
  const receiptId = new URL(request.url).searchParams.get("receiptId");
  if (!id || id.length > 128 || !receiptId || receiptId.length > 128) {
    return NextResponse.json({ error: "Invalid receipt request." }, { status: 400 });
  }

  try {
    const receipt = await prisma.paymentReceipt.findFirst({
      where: {
        id: receiptId,
        orderId: id,
        order: { paymentMethod: "bank" },
      },
      select: {
        storagePath: true,
        contentType: true,
      },
    });
    if (!receipt) {
      return NextResponse.json({ error: "Receipt not found." }, { status: 404 });
    }

    const { bytes } = await downloadPrivatePaymentReceipt(receipt.storagePath);
    const contentType = RECEIPT_CONTENT_TYPES.has(receipt.contentType)
      ? receipt.contentType
      : "application/octet-stream";
    const extension =
      contentType === "application/pdf"
        ? "pdf"
        : contentType === "image/png"
          ? "png"
          : contentType === "image/webp"
            ? "webp"
            : "jpg";

    return new NextResponse(Buffer.from(bytes), {
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Disposition": `inline; filename="payment-receipt.${extension}"`,
        "Content-Length": String(bytes.byteLength),
        "Content-Type": contentType,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("ADMIN_PAYMENT_RECEIPT_DOWNLOAD_FAILED", error);
    return NextResponse.json(
      { error: "Unable to load the private receipt." },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}
