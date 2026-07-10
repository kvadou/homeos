import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createChatSessionSchema } from "@homeos/shared";

export async function GET() {
  try {
    const user = await requireAuth();

    const sessions = await prisma.chatSession.findMany({
      where: { userId: user.id },
      include: {
        _count: { select: { messages: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ success: true, data: sessions });
  } catch {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();

    const parsed = createChatSessionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.errors[0]?.message ?? "Validation failed",
        },
        { status: 400 }
      );
    }

    const session = await prisma.chatSession.create({
      data: {
        userId: user.id,
        homeId: parsed.data.homeId || null,
        title: parsed.data.title || null,
      },
    });

    return NextResponse.json({ success: true, data: session }, { status: 201 });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to create session" },
      { status: 500 }
    );
  }
}
