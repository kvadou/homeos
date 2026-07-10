import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createItemSchema } from "@homeos/shared";
import { canCreateItem } from "@/lib/plan-limits";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(req.url);
    const homeId = searchParams.get("homeId");
    const roomId = searchParams.get("roomId");
    const category = searchParams.get("category");

    const items = await prisma.item.findMany({
      where: {
        home: { users: { some: { userId: user.id } } },
        ...(homeId && { homeId }),
        ...(roomId && { roomId }),
        ...(category && { category }),
      },
      include: {
        home: { select: { id: true, name: true } },
        room: { select: { id: true, name: true, roomType: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: items });
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

    // Check plan limits
    const allowed = await canCreateItem(user.id);
    if (!allowed) {
      return NextResponse.json(
        { success: false, error: "Plan limit reached", code: "PLAN_LIMIT" },
        { status: 402 }
      );
    }

    const body = await req.json();

    const parsed = createItemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message ?? "Validation failed" },
        { status: 400 }
      );
    }

    // Verify user owns the home
    const home = await prisma.home.findFirst({
      where: {
        id: parsed.data.homeId,
        users: { some: { userId: user.id } },
      },
    });

    if (!home) {
      return NextResponse.json(
        { success: false, error: "Home not found" },
        { status: 404 }
      );
    }

    const { purchaseDate, warrantyExpiry, ...rest } = parsed.data;

    const item = await prisma.item.create({
      data: {
        ...rest,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : undefined,
        warrantyExpiry: warrantyExpiry ? new Date(warrantyExpiry) : undefined,
      },
      include: {
        room: { select: { id: true, name: true, roomType: true } },
      },
    });

    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to create item" },
      { status: 500 }
    );
  }
}
