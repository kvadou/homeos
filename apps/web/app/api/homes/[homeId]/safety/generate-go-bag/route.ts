import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getClaudeClient, DEFAULT_MODEL } from "@homeos/ai";

interface Context {
  params: Promise<{ homeId: string }>;
}

export async function POST(req: NextRequest, ctx: Context) {
  try {
    const user = await requireAuth();
    const { homeId } = await ctx.params;

    const home = await prisma.home.findFirst({
      where: {
        id: homeId,
        users: { some: { userId: user.id } },
      },
    });

    if (!home) {
      return NextResponse.json(
        { success: false, error: "Home not found" },
        { status: 404 }
      );
    }

    const locationInfo = [
      home.state && `State: ${home.state}`,
      home.zipCode && `ZIP: ${home.zipCode}`,
      home.city && `City: ${home.city}`,
    ]
      .filter(Boolean)
      .join(", ");

    const claude = getClaudeClient();
    const response = await claude.messages.create({
      model: DEFAULT_MODEL,
      max_tokens: 2048,
      system:
        "You are a home emergency preparedness expert. Generate a personalized go-bag checklist based on the homeowner's location and local hazards. Return ONLY a valid JSON array of objects with 'title' and 'description' fields. Each item should be a specific, actionable go-bag item. Include 12-15 items. Consider local climate, natural disaster risks, and general emergency needs.",
      messages: [
        {
          role: "user",
          content: `Generate a go-bag checklist for a home located at: ${locationInfo || "United States (location not specified)"}. Consider local weather patterns, natural disaster risks (earthquakes, hurricanes, tornadoes, floods, wildfires, etc.), and essential emergency supplies. Return as a JSON array of {title, description} objects.`,
        },
      ],
    });

    const textBlock = response.content.find((block) => block.type === "text");
    const rawText = textBlock?.text ?? "[]";

    // Extract JSON from the response (handle markdown code blocks)
    let jsonStr = rawText;
    const jsonMatch = rawText.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }

    const items: Array<{ title: string; description: string }> = JSON.parse(jsonStr);

    // Create SafetyInfo records for each go-bag item
    const created = await prisma.$transaction(
      items.map((item, index) =>
        prisma.safetyInfo.create({
          data: {
            homeId,
            type: "go_bag_item",
            title: item.title,
            description: item.description,
            sortOrder: index,
          },
        })
      )
    );

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error) {
    console.error("Failed to generate go-bag checklist:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate go-bag checklist" },
      { status: 500 }
    );
  }
}
