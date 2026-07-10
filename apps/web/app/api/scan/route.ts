import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { analyzeItemImage } from "@homeos/ai/vision";
import { canUseScan, recordScanUsage } from "@/lib/plan-limits";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    // Check plan limits
    const allowed = await canUseScan(user.id);
    if (!allowed) {
      return NextResponse.json(
        { success: false, error: "Plan limit reached", code: "PLAN_LIMIT" },
        { status: 402 }
      );
    }

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

    const data = await analyzeItemImage(image, resolvedMediaType);

    // Record scan usage for plan limit tracking
    await recordScanUsage(user.id);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.error("Scan error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to analyze image" },
      { status: 500 }
    );
  }
}
