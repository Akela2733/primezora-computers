import { NextResponse } from "next/server";

import { requireCustomerApiWithProfileCheck } from "@/lib/customer-auth";
import { prisma } from "@/lib/prisma";
import {
  deletePrivatePaymentReceipt,
  uploadPrivatePaymentReceipt,
} from "@/lib/payment-receipt-storage";
import {
  getSafeReceiptFilename,
  MAX_PAYMENT_RECEIPT_BYTES,
  validatePaymentReceipt,
} from "@/lib/receipt-validation";
import { enforceRateLimits, getClientIp } from "@/lib/rate-limit";

type RouteContext = {
  params: Promise<{ id: string }>;
};

class ReceiptOrderConflictError extends Error {}
class ReceiptPayloadTooLargeError extends Error {}
class InvalidReceiptFormError extends Error {}

const MAX_RECEIPT_REQUEST_BYTES = MAX_PAYMENT_RECEIPT_BYTES + 100_000;

async function readReceiptForm(request: Request): Promise<FormData> {
  const contentType = request.headers.get("content-type");
  if (!contentType?.toLowerCase().startsWith("multipart/form-data;")) {
    throw new InvalidReceiptFormError();
  }

  const reader = request.body?.getReader();
  if (!reader) throw new InvalidReceiptFormError();

  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;

      totalBytes += value.byteLength;
      if (totalBytes > MAX_RECEIPT_REQUEST_BYTES) {
        await reader.cancel();
        throw new ReceiptPayloadTooLargeError();
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const body = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return await new Response(body, {
      headers: { "Content-Type": contentType },
    }).formData();
  } catch (error) {
    if (error instanceof TypeError || error instanceof SyntaxError) {
      throw new InvalidReceiptFormError();
    }
    throw error;
  }
}

export async function POST(request: Request, { params }: RouteContext) {
  const auth = await requireCustomerApiWithProfileCheck();
  if (auth.response) return auth.response;

  const customerId = auth.session.customer.id;
  const limited = await enforceRateLimits(request, [
    { policy: "paymentReceiptUpload", identifier: `customer:${customerId}` },
    { policy: "paymentReceiptUpload", identifier: getClientIp(request) },
  ]);
  if (limited) return limited;

  const { id } = await params;
  if (!id || id.length > 128) {
    return NextResponse.json({ error: "Invalid order ID." }, { status: 400 });
  }

  const contentLength = Number(request.headers.get("content-length"));
  if (
    Number.isFinite(contentLength) &&
    contentLength > MAX_RECEIPT_REQUEST_BYTES
  ) {
    return NextResponse.json(
      { error: "Receipt files must be 10 MB or smaller." },
      { status: 413 }
    );
  }

  let uploadedPath: string | undefined;
  try {
    const order = await prisma.order.findFirst({
      where: { id, customerId },
      select: {
        id: true,
        paymentMethod: true,
        paymentStatus: true,
        paymentExpiresAt: true,
        status: true,
      },
    });
    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }
    if (order.paymentMethod !== "bank") {
      return NextResponse.json(
        { error: "Receipts can only be uploaded for bank-transfer orders." },
        { status: 409 }
      );
    }
    if (!order.paymentExpiresAt || order.paymentExpiresAt.getTime() <= Date.now()) {
      return NextResponse.json(
        { error: "The payment window expired. Contact Primezora for assistance." },
        { status: 409 }
      );
    }
    if (
      order.status === "CANCELLED" ||
      !["PAYMENT_PENDING", "PAYMENT_REJECTED"].includes(
        order.paymentStatus ?? ""
      )
    ) {
      return NextResponse.json(
        { error: "This order is not accepting a receipt right now." },
        { status: 409 }
      );
    }

    const form = await readReceiptForm(request);
    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json(
        { error: "Choose a receipt image or PDF file." },
        { status: 400 }
      );
    }
    if (file.size > MAX_PAYMENT_RECEIPT_BYTES) {
      return NextResponse.json(
        { error: "Receipt files must be 10 MB or smaller." },
        { status: 413 }
      );
    }

    const buffer = new Uint8Array(await file.arrayBuffer());
    const validation = validatePaymentReceipt(buffer, file.type);
    if (!validation) {
      return NextResponse.json(
        { error: "Upload a valid JPEG, PNG, WebP image, or PDF receipt." },
        { status: 400 }
      );
    }

    uploadedPath = await uploadPrivatePaymentReceipt({
      orderId: order.id,
      extension: validation.extension,
      contentType: validation.contentType,
      buffer,
    });

    const now = new Date();
    const submitted = await prisma.$transaction(async (tx) => {
      const changed = await tx.order.updateMany({
        where: {
          id: order.id,
          customerId,
          paymentMethod: "bank",
          paymentExpiresAt: { gt: now },
          paymentStatus: { in: ["PAYMENT_PENDING", "PAYMENT_REJECTED"] },
          status: { not: "CANCELLED" },
        },
        data: { paymentStatus: "PAYMENT_VERIFICATION_PENDING" },
      });
      if (changed.count !== 1) throw new ReceiptOrderConflictError();

      const receipt = await tx.paymentReceipt.create({
        data: {
          orderId: order.id,
          storagePath: uploadedPath!,
          contentType: validation.contentType,
          sizeBytes: buffer.byteLength,
          originalFilename: getSafeReceiptFilename(file.name),
        },
        select: { id: true, submittedAt: true },
      });
      await tx.paymentAuditEvent.create({
        data: {
          orderId: order.id,
          receiptId: receipt.id,
          action: "RECEIPT_SUBMITTED",
          changedBy: `customer:${customerId}`,
        },
      });
      return receipt;
    });

    return NextResponse.json(
      {
        success: true,
        paymentStatus: "PAYMENT_VERIFICATION_PENDING",
        submittedAt: submitted.submittedAt,
      },
      { status: 201, headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    if (uploadedPath) {
      try {
        await deletePrivatePaymentReceipt(uploadedPath);
      } catch (cleanupError) {
        console.error("PAYMENT_RECEIPT_ORPHAN_CLEANUP_FAILED", cleanupError);
      }
    }
    if (error instanceof ReceiptOrderConflictError) {
      return NextResponse.json(
        { error: "Order payment status changed. Refresh and try again." },
        { status: 409 }
      );
    }
    if (error instanceof ReceiptPayloadTooLargeError) {
      return NextResponse.json(
        { error: "Receipt files must be 10 MB or smaller." },
        { status: 413 }
      );
    }
    if (error instanceof InvalidReceiptFormError || error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Choose a receipt image or PDF file." },
        { status: 400 }
      );
    }
    console.error("CUSTOMER_PAYMENT_RECEIPT_UPLOAD_FAILED", error);
    return NextResponse.json(
      { error: "Unable to save the receipt. Please try again." },
      { status: 503 }
    );
  }
}
