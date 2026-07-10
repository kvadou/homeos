import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { inspectHomeIssue } from "@homeos/ai";

export async function POST(req: NextRequest) {
  try {
    await requireAuth();

    const body = await req.json();
    const { image, mediaType, description, roomType } = body as {
      image: string;
      mediaType: string;
      description?: string;
      roomType?: string;
    };

    if (!image || typeof image !== "string") {
      return NextResponse.json(
        { success: false, error: "Image data is required" },
        { status: 400 }
      );
    }

    const validMediaTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
    ] as const;
    const resolvedMediaType = validMediaTypes.includes(
      mediaType as (typeof validMediaTypes)[number]
    )
      ? (mediaType as (typeof validMediaTypes)[number])
      : "image/jpeg";

    const result = await inspectHomeIssue(
      image,
      resolvedMediaType,
      description,
      roomType
    );

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("Home inspection error:", error);
    const message =
      error instanceof Error && error.message === "Unauthorized"
        ? "Unauthorized"
        : "Failed to inspect image";
    const status =
      error instanceof Error && error.message === "Unauthorized" ? 401 : 500;
    return NextResponse.json(
      { success: false, error: message },
      { status }
    );
  }
}
