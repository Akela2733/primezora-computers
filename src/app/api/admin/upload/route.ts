import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import {
  uploadProductImage,
  MAX_IMAGE_SIZE_BYTES,
  ALLOWED_MIME_TYPES,
} from "@/lib/storage";

export async function POST(request: Request) {
  // 1. Verify admin privileges
  const authResponse = await requireAdminApi();
  if (authResponse) {
    return authResponse;
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No image file provided in upload request." },
        { status: 400 }
      );
    }

    if (file.size === 0) {
      return NextResponse.json(
        { error: "The provided file is empty." },
        { status: 400 }
      );
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      return NextResponse.json(
        {
          error: `File size exceeds the 5 MB limit (current: ${(
            file.size /
            (1024 * 1024)
          ).toFixed(1)} MB).`,
        },
        { status: 400 }
      );
    }

    const normalizedMime = file.type.toLowerCase().trim();
    if (!ALLOWED_MIME_TYPES[normalizedMime]) {
      return NextResponse.json(
        {
          error:
            "Unsupported file type. Please upload a JPEG, PNG, WebP, AVIF, or GIF image.",
        },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await uploadProductImage(buffer, normalizedMime);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to process image upload." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        url: result.url,
        filename: result.filename,
        provider: result.provider,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("ADMIN UPLOAD ERROR:", error);
    return NextResponse.json(
      { error: "Server error occurred while uploading product image." },
      { status: 500 }
    );
  }
}
