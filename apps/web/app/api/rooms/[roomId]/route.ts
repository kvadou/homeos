import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { updateRoomSchema } from "@homeos/shared";

interface Context {
  params: Promise<{ roomId: string }>;
}

export async function PUT(req: NextRequest, ctx: Context) {
  try {
    const user = await requireAuth();
    const { roomId } = await ctx.params;
    const body = await req.json();

    const room = await prisma.room.findFirst({
      where: {
        id: roomId,
        home: { users: { some: { userId: user.id } } },
      },
    });

    if (!room) {
      return NextResponse.json(
        { success: false, error: "Room not found" },
        { status: 404 }
      );
    }

    const parsed = updateRoomSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message ?? "Validation failed" },
        { status: 400 }
      );
    }

    const { paintPurchaseDate, ...rest } = parsed.data;

    const updated = await prisma.room.update({
      where: { id: roomId },
      data: {
        ...rest,
        ...(paintPurchaseDate !== undefined && {
          paintPurchaseDate: paintPurchaseDate ? new Date(paintPurchaseDate) : null,
        }),
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to update room" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, ctx: Context) {
  try {
    const user = await requireAuth();
    const { roomId } = await ctx.params;

    const room = await prisma.room.findFirst({
      where: {
        id: roomId,
        home: { users: { some: { userId: user.id } } },
      },
    });

    if (!room) {
      return NextResponse.json(
        { success: false, error: "Room not found" },
        { status: 404 }
      );
    }

    await prisma.room.delete({ where: { id: roomId } });

    return NextResponse.json({ success: true, data: { id: roomId } });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to delete room" },
      { status: 500 }
    );
  }
}
