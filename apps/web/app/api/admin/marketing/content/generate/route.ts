import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { generateMarketingContent } from "@homeos/ai/marketing";

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();

    const body = await req.json();
    const { type, platform, topic, tone, audience } = body;

    if (!type || !topic) {
      return NextResponse.json(
        { success: false, error: "Type and topic are required" },
        { status: 400 }
      );
    }

    const validTypes = ["blog", "social", "email", "ad_copy"];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { success: false, error: `Invalid type. Must be one of: ${validTypes.join(", ")}` },
        { status: 400 }
      );
    }

    const result = await generateMarketingContent(type, platform, topic, tone, audience);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate content";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
