import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getRepairHelp } from "@homeos/ai";

interface Context {
  params: Promise<{ itemId: string }>;
}

export async function POST(req: NextRequest, ctx: Context) {
  try {
    const user = await requireAuth();
    const { itemId } = await ctx.params;

    const body = await req.json();
    const { issue, zipCode } = body as { issue: string; zipCode?: string };

    if (!issue || typeof issue !== "string" || issue.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Please describe the issue you are experiencing." },
        { status: 400 }
      );
    }

    // Fetch item details and verify ownership
    const item = await prisma.item.findFirst({
      where: {
        id: itemId,
        home: { users: { some: { userId: user.id } } },
      },
      include: {
        home: { select: { zipCode: true } },
        manuals: {
          include: {
            manual: {
              include: {
                chunks: {
                  take: 5,
                  orderBy: { pageNumber: "asc" },
                  select: { content: true, pageNumber: true },
                },
              },
            },
          },
        },
      },
    });

    if (!item) {
      return NextResponse.json(
        { success: false, error: "Item not found" },
        { status: 404 }
      );
    }

    // Build manual context from associated manuals if available
    let manualContext: string | undefined;
    const allChunks = item.manuals.flatMap((im) =>
      im.manual.chunks.map((c) => ({
        content: c.content,
        pageNumber: c.pageNumber,
        title: im.manual.title,
      }))
    );

    if (allChunks.length > 0) {
      manualContext = allChunks
        .map(
          (c) =>
            `From "${c.title}"${c.pageNumber ? ` (p.${c.pageNumber})` : ""}:\n${c.content}`
        )
        .join("\n\n");
    }

    const result = await getRepairHelp({
      itemName: item.name,
      brand: item.brand,
      model: item.model,
      category: item.category,
      issue: issue.trim(),
      manualContext,
      zipCode: zipCode || item.home.zipCode,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("Repair help error:", error);
    const message =
      error instanceof Error && error.message === "Unauthorized"
        ? "Unauthorized"
        : "Failed to get repair help";
    const status =
      error instanceof Error && error.message === "Unauthorized" ? 401 : 500;
    return NextResponse.json(
      { success: false, error: message },
      { status }
    );
  }
}
