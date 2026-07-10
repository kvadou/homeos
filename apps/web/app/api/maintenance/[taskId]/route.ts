import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { updateMaintenanceTaskSchema } from "@homeos/shared";

interface Context {
  params: Promise<{ taskId: string }>;
}

export async function GET(req: NextRequest, ctx: Context) {
  try {
    const user = await requireAuth();
    const { taskId } = await ctx.params;

    const task = await prisma.maintenanceTask.findFirst({
      where: {
        id: taskId,
        item: {
          home: { users: { some: { userId: user.id } } },
        },
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
        logs: {
          orderBy: { performedAt: "desc" },
        },
      },
    });

    if (!task) {
      return NextResponse.json(
        { success: false, error: "Task not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: task });
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
    const { taskId } = await ctx.params;
    const body = await req.json();

    const existing = await prisma.maintenanceTask.findFirst({
      where: {
        id: taskId,
        item: {
          home: { users: { some: { userId: user.id } } },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Task not found" },
        { status: 404 }
      );
    }

    const parsed = updateMaintenanceTaskSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message ?? "Validation failed" },
        { status: 400 }
      );
    }

    const { nextDueDate, ...rest } = parsed.data;

    const task = await prisma.maintenanceTask.update({
      where: { id: taskId },
      data: {
        ...rest,
        ...(nextDueDate !== undefined && {
          nextDueDate: nextDueDate ? new Date(nextDueDate) : null,
        }),
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

    return NextResponse.json({ success: true, data: task });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to update task" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, ctx: Context) {
  try {
    const user = await requireAuth();
    const { taskId } = await ctx.params;

    const existing = await prisma.maintenanceTask.findFirst({
      where: {
        id: taskId,
        item: {
          home: { users: { some: { userId: user.id } } },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Task not found" },
        { status: 404 }
      );
    }

    await prisma.maintenanceTask.delete({ where: { id: taskId } });

    return NextResponse.json({ success: true, data: { id: taskId } });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to delete task" },
      { status: 500 }
    );
  }
}
