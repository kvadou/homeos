import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createManualSchema } from "@homeos/shared";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get("itemId");

    const manuals = await prisma.manual.findMany({
      where: itemId
        ? {
            items: {
              some: {
                itemId,
                item: { home: { users: { some: { userId: user.id } } } },
              },
            },
          }
        : {
            items: {
              some: {
                item: { home: { users: { some: { userId: user.id } } } },
              },
            },
          },
      include: {
        items: {
          include: {
            item: { select: { id: true, name: true, brand: true } },
          },
        },
        _count: { select: { chunks: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: manuals });
  } catch {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth();
    const body = await req.json();

    const parsed = createManualSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.errors[0]?.message ?? "Validation failed",
        },
        { status: 400 }
      );
    }

    const { itemIds, ...manualData } = parsed.data;

    const manual = await prisma.manual.create({
      data: {
        ...manualData,
        ...(itemIds &&
          itemIds.length > 0 && {
            items: {
              create: itemIds.map((itemId) => ({ itemId })),
            },
          }),
      },
      include: {
        items: {
          include: {
            item: { select: { id: true, name: true, brand: true } },
          },
        },
        _count: { select: { chunks: true } },
      },
    });

    return NextResponse.json({ success: true, data: manual }, { status: 201 });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to create manual" },
      { status: 500 }
    );
  }
}
