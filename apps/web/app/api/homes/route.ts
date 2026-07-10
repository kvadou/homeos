import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createHomeSchema } from "@homeos/shared";
import { canCreateHome } from "@/lib/plan-limits";

export async function GET() {
  try {
    const user = await requireAuth();

    const homes = await prisma.home.findMany({
      where: {
        users: { some: { userId: user.id } },
      },
      include: {
        _count: { select: { rooms: true, items: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: homes });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();

    // Check plan limits
    const allowed = await canCreateHome(user.id);
    if (!allowed) {
      return NextResponse.json(
        { success: false, error: "Plan limit reached", code: "PLAN_LIMIT" },
        { status: 402 }
      );
    }

    const body = await req.json();

    const parsed = createHomeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message ?? "Validation failed" },
        { status: 400 }
      );
    }

    const home = await prisma.home.create({
      data: {
        ...parsed.data,
        users: {
          create: {
            userId: user.id,
            role: "owner",
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: home }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to create home" },
      { status: 500 }
    );
  }
}
