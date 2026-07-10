import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateMaintenancePlan } from "@homeos/ai";

interface Context {
  params: Promise<{ homeId: string }>;
}

export async function POST(req: NextRequest, ctx: Context) {
  try {
    const user = await requireAuth();
    const { homeId } = await ctx.params;

    const home = await prisma.home.findFirst({
      where: {
        id: homeId,
        users: { some: { userId: user.id } },
      },
      include: {
        items: {
          select: {
            id: true,
            name: true,
            category: true,
            brand: true,
            model: true,
            purchaseDate: true,
            condition: true,
          },
        },
      },
    });

    if (!home) {
      return NextResponse.json(
        { success: false, error: "Home not found" },
        { status: 404 }
      );
    }

    // Check for existing tasks to avoid duplicates
    const existingTaskCount = await prisma.maintenanceTask.count({
      where: {
        item: { homeId: home.id },
      },
    });

    const plan = await generateMaintenancePlan(
      {
        name: home.name,
        yearBuilt: home.yearBuilt,
        zipCode: home.zipCode,
        homeType: home.homeType,
        squareFeet: home.squareFeet,
      },
      home.items.map((item) => ({
        id: item.id,
        name: item.name,
        category: item.category,
        brand: item.brand,
        model: item.model,
        purchaseDate: item.purchaseDate
          ? item.purchaseDate.toISOString().split("T")[0]
          : null,
        condition: item.condition,
      }))
    );

    return NextResponse.json({
      success: true,
      data: {
        plan,
        existingTaskCount,
        itemCount: home.items.length,
      },
    });
  } catch (error) {
    console.error("Generate maintenance plan error:", error);
    const message =
      error instanceof Error && error.message === "Unauthorized"
        ? "Unauthorized"
        : "Failed to generate maintenance plan";
    const status =
      error instanceof Error && error.message === "Unauthorized" ? 401 : 500;
    return NextResponse.json(
      { success: false, error: message },
      { status }
    );
  }
}
