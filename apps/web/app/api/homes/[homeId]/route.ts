import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { updateHomeSchema } from "@homeos/shared";

interface Context {
  params: Promise<{ homeId: string }>;
}

export async function GET(req: NextRequest, ctx: Context) {
  try {
    const user = await requireAuth();
    const { homeId } = await ctx.params;

    const home = await prisma.home.findFirst({
      where: {
        id: homeId,
        users: { some: { userId: user.id } },
      },
      include: {
        rooms: {
          include: { _count: { select: { items: true } } },
          orderBy: { name: "asc" },
        },
        _count: { select: { rooms: true, items: true } },
      },
    });

    if (!home) {
      return NextResponse.json(
        { success: false, error: "Home not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: home });
  } catch {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }
}

export async function PUT(req: NextRequest, ctx: Context) {
  try {
    const user = await requireAuth();
    const { homeId } = await ctx.params;
    const body = await req.json();

    const existing = await prisma.home.findFirst({
      where: {
        id: homeId,
        users: { some: { userId: user.id } },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Home not found" },
        { status: 404 }
      );
    }

    const parsed = updateHomeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message ?? "Validation failed" },
        { status: 400 }
      );
    }

    const home = await prisma.home.update({
      where: { id: homeId },
      data: parsed.data,
    });

    return NextResponse.json({ success: true, data: home });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to update home" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, ctx: Context) {
  try {
    const user = await requireAuth();
    const { homeId } = await ctx.params;

    const existing = await prisma.home.findFirst({
      where: {
        id: homeId,
        users: { some: { userId: user.id } },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Home not found" },
        { status: 404 }
      );
    }

    await prisma.home.delete({ where: { id: homeId } });

    return NextResponse.json({ success: true, data: { id: homeId } });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to delete home" },
      { status: 500 }
    );
  }
}
