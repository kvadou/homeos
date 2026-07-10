import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createMaintenanceLogSchema } from "@homeos/shared";

interface Context {
  params: Promise<{ taskId: string }>;
}

export async function POST(req: NextRequest, ctx: Context) {
  try {
    const user = await requireAuth();
    const { taskId } = await ctx.params;
    const body = await req.json();

    // Verify user owns the task's item's home
    const task = await prisma.maintenanceTask.findFirst({
      where: {
        id: taskId,
        item: {
          home: { users: { some: { userId: user.id } } },
        },
      },
    });

    if (!task) {
      return NextResponse.json(
        { success: false, error: "Task not found" },
        { status: 404 }
      );
    }

    const parsed = createMaintenanceLogSchema.safeParse({
      ...body,
      taskId,
    });
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message ?? "Validation failed" },
        { status: 400 }
      );
    }

    const log = await prisma.maintenanceLog.create({
      data: {
        taskId,
        notes: parsed.data.notes,
        cost: parsed.data.cost,
        performedBy: parsed.data.performedBy,
      },
    });

    // Mark task as completed
    await prisma.maintenanceTask.update({
      where: { id: taskId },
      data: { status: "completed" },
    });

    return NextResponse.json({ success: true, data: log }, { status: 201 });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to log completion" },
      { status: 500 }
    );
  }
}
