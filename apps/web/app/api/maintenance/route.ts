import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createMaintenanceTaskSchema } from "@homeos/shared";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(req.url);
    const homeId = searchParams.get("homeId");
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");

    const tasks = await prisma.maintenanceTask.findMany({
      where: {
        item: {
          home: { users: { some: { userId: user.id } } },
          ...(homeId && { homeId }),
        },
        ...(status && { status }),
        ...(priority && { priority }),
      },
      include: {
        item: {
          select: {
            id: true,
            name: true,
            category: true,
            home: { select: { id: true, name: true } },
            room: { select: { id: true, name: true } },
          },
        },
        _count: { select: { logs: true } },
      },
      orderBy: { nextDueDate: "asc" },
    });

    return NextResponse.json({ success: true, data: tasks });
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

    const parsed = createMaintenanceTaskSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message ?? "Validation failed" },
        { status: 400 }
      );
    }

    // Verify user owns the item's home
    const item = await prisma.item.findFirst({
      where: {
        id: parsed.data.itemId,
        home: { users: { some: { userId: user.id } } },
      },
    });

    if (!item) {
      return NextResponse.json(
        { success: false, error: "Item not found" },
        { status: 404 }
      );
    }

    const { nextDueDate, ...rest } = parsed.data;

    const task = await prisma.maintenanceTask.create({
      data: {
        ...rest,
        nextDueDate: nextDueDate ? new Date(nextDueDate) : undefined,
      },
      include: {
        item: {
          select: {
            id: true,
            name: true,
            category: true,
            home: { select: { id: true, name: true } },
            room: { select: { id: true, name: true } },
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: task }, { status: 201 });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to create maintenance task" },
      { status: 500 }
    );
  }
}
