import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { updateManualSchema } from "@homeos/shared";

interface Context {
  params: Promise<{ manualId: string }>;
}

export async function GET(req: NextRequest, ctx: Context) {
  try {
    const user = await requireAuth();
    const { manualId } = await ctx.params;

    const manual = await prisma.manual.findFirst({
      where: {
        id: manualId,
        items: {
          some: {
            item: { home: { users: { some: { userId: user.id } } } },
          },
        },
      },
      include: {
        chunks: {
          select: {
            id: true,
            content: true,
            pageNumber: true,
            chunkIndex: true,
            createdAt: true,
          },
          orderBy: { chunkIndex: "asc" },
        },
        items: {
          include: {
            item: { select: { id: true, name: true, brand: true, model: true } },
          },
        },
        _count: { select: { chunks: true } },
      },
    });

    if (!manual) {
      return NextResponse.json(
        { success: false, error: "Manual not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: manual });
  } catch {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }
}

export async function PATCH(req: NextRequest, ctx: Context) {
  try {
    const user = await requireAuth();
    const { manualId } = await ctx.params;
    const body = await req.json();

    const existing = await prisma.manual.findFirst({
      where: {
        id: manualId,
        items: {
          some: {
            item: { home: { users: { some: { userId: user.id } } } },
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Manual not found" },
        { status: 404 }
      );
    }

    const parsed = updateManualSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.errors[0]?.message ?? "Validation failed",
        },
        { status: 400 }
      );
    }

    const { itemIds, ...updateData } = parsed.data;

    const manual = await prisma.manual.update({
      where: { id: manualId },
      data: updateData,
      include: {
        items: {
          include: {
            item: { select: { id: true, name: true, brand: true } },
          },
        },
        _count: { select: { chunks: true } },
      },
    });

    return NextResponse.json({ success: true, data: manual });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to update manual" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, ctx: Context) {
  try {
    const user = await requireAuth();
    const { manualId } = await ctx.params;

    const existing = await prisma.manual.findFirst({
      where: {
        id: manualId,
        items: {
          some: {
            item: { home: { users: { some: { userId: user.id } } } },
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Manual not found" },
        { status: 404 }
      );
    }

    await prisma.manual.delete({ where: { id: manualId } });

    return NextResponse.json({ success: true, data: { id: manualId } });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to delete manual" },
      { status: 500 }
    );
  }
}
