import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { analyzeReceipt } from "@homeos/ai/vision";

export async function POST(request: NextRequest) {
  try {
    await requireAuth();

    const body = await request.json();
    const { image, mediaType } = body as {
      image?: string;
      mediaType?: string;
    };

    if (!image) {
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
    type MediaType = (typeof validMediaTypes)[number];

    const resolvedMediaType: MediaType = validMediaTypes.includes(
      mediaType as MediaType
    )
      ? (mediaType as MediaType)
      : "image/jpeg";

    const data = await analyzeReceipt(image, resolvedMediaType);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.error("Receipt scan error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to analyze receipt" },
      { status: 500 }
    );
  }
}
