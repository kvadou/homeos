import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { updateItemSchema } from "@homeos/shared";

interface Context {
  params: Promise<{ itemId: string }>;
}

export async function GET(req: NextRequest, ctx: Context) {
  try {
    const user = await requireAuth();
    const { itemId } = await ctx.params;

    const item = await prisma.item.findFirst({
      where: {
        id: itemId,
        home: { users: { some: { userId: user.id } } },
      },
      include: {
        room: { select: { id: true, name: true, roomType: true } },
        home: { select: { id: true, name: true } },
        maintenanceTasks: {
          orderBy: { nextDueDate: "asc" },
          take: 5,
        },
        documents: { orderBy: { createdAt: "desc" } },
        parts: { orderBy: { name: "asc" } },
      },
    });

    if (!item) {
      return NextResponse.json(
        { success: false, error: "Item not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: item });
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
    const { itemId } = await ctx.params;
    const body = await req.json();

    const existing = await prisma.item.findFirst({
      where: {
        id: itemId,
        home: { users: { some: { userId: user.id } } },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Item not found" },
        { status: 404 }
      );
    }

    const parsed = updateItemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message ?? "Validation failed" },
        { status: 400 }
      );
    }

    const { purchaseDate, warrantyExpiry, ...rest } = parsed.data;

    const item = await prisma.item.update({
      where: { id: itemId },
      data: {
        ...rest,
        ...(purchaseDate !== undefined && {
          purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        }),
        ...(warrantyExpiry !== undefined && {
          warrantyExpiry: warrantyExpiry ? new Date(warrantyExpiry) : null,
        }),
      },
      include: {
        room: { select: { id: true, name: true, roomType: true } },
      },
    });

    return NextResponse.json({ success: true, data: item });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to update item" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, ctx: Context) {
  try {
    const user = await requireAuth();
    const { itemId } = await ctx.params;

    const existing = await prisma.item.findFirst({
      where: {
        id: itemId,
        home: { users: { some: { userId: user.id } } },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Item not found" },
        { status: 404 }
      );
    }

    await prisma.item.delete({ where: { id: itemId } });

    return NextResponse.json({ success: true, data: { id: itemId } });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to delete item" },
      { status: 500 }
    );
  }
}
