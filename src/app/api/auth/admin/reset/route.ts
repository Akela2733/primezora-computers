import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error:
        "Administrator credentials are managed through deployment configuration. Contact an authorized deployment operator.",
    },
    { status: 403 }
  );
}
