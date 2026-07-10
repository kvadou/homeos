import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { updateItemWarrantySchema } from "@homeos/shared";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const user = await requireAuth();
    const { itemId } = await params;

    // Verify ownership
    const item = await prisma.item.findFirst({
      where: {
        id: itemId,
        home: { users: { some: { userId: user.id } } },
      },
    });

    if (!item) {
      return NextResponse.json(
        { success: false, error: "Item not found" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const parsed = updateItemWarrantySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const updated = await prisma.item.update({
      where: { id: itemId },
      data: {
        warrantyExpiry: parsed.data.warrantyExpiry
          ? new Date(parsed.data.warrantyExpiry)
          : null,
        warrantyProvider: parsed.data.warrantyProvider ?? null,
        warrantyType: parsed.data.warrantyType ?? null,
        warrantyNotes: parsed.data.warrantyNotes ?? null,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }
}
