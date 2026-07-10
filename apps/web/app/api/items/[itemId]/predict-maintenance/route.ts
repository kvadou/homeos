import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { predictMaintenanceNeeds } from "@homeos/ai";

interface RouteParams {
  params: Promise<{ itemId: string }>;
}

export async function GET(_req: Request, { params }: RouteParams) {
  try {
    const user = await requireAuth();
    const { itemId } = await params;

    const item = await prisma.item.findFirst({
      where: {
        id: itemId,
        home: { users: { some: { userId: user.id } } },
      },
      include: {
        maintenanceTasks: {
          include: {
            logs: {
              orderBy: { performedAt: "desc" },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        manuals: {
          include: {
            manual: {
              include: {
                chunks: {
                  select: { content: true },
                  take: 10,
                },
              },
            },
          },
        },
      },
    });

    if (!item) {
      return NextResponse.json(
        { success: false, error: "Item not found" },
        { status: 404 }
      );
    }

    const manualChunks = item.manuals.flatMap((im) =>
      im.manual.chunks.map((c) => c.content)
    );

    const result = await predictMaintenanceNeeds(
      {
        name: item.name,
        brand: item.brand,
        model: item.model,
        category: item.category,
        condition: item.condition,
        purchaseDate: item.purchaseDate,
        warrantyExpiry: item.warrantyExpiry,
      },
      item.maintenanceTasks.map((task) => ({
        title: task.title,
        description: task.description,
        frequency: task.frequency,
        status: task.status,
        nextDueDate: task.nextDueDate,
        logs: task.logs.map((log) => ({
          notes: log.notes,
          cost: log.cost,
          performedAt: log.performedAt,
        })),
      })),
      manualChunks.length > 0 ? manualChunks : undefined
    );

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    console.error("Predict maintenance error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate maintenance predictions" },
      { status: 500 }
    );
  }
}
