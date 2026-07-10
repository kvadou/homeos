import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { updateProviderSchema } from "@homeos/shared";

interface Context {
  params: Promise<{ providerId: string }>;
}

export async function GET(req: NextRequest, ctx: Context) {
  try {
    await requireAuth();
    const { providerId } = await ctx.params;

    const provider = await prisma.providerProfile.findUnique({
      where: { id: providerId },
      include: {
        reviews: {
          orderBy: { createdAt: "desc" },
        },
        availability: {
          orderBy: { dayOfWeek: "asc" },
        },
      },
    });

    if (!provider) {
      return NextResponse.json(
        { success: false, error: "Provider not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: provider });
  } catch {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }
}

export async function PATCH(req: NextRequest, ctx: Context) {
  try {
    await requireAuth();
    const { providerId } = await ctx.params;
    const body = await req.json();

    const existing = await prisma.providerProfile.findUnique({
      where: { id: providerId },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Provider not found" },
        { status: 404 }
      );
    }

    const parsed = updateProviderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message ?? "Validation failed" },
        { status: 400 }
      );
    }

    const provider = await prisma.providerProfile.update({
      where: { id: providerId },
      data: parsed.data,
    });

    return NextResponse.json({ success: true, data: provider });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to update provider" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, ctx: Context) {
  try {
    await requireAuth();
    const { providerId } = await ctx.params;

    const existing = await prisma.providerProfile.findUnique({
      where: { id: providerId },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Provider not found" },
        { status: 404 }
      );
    }

    await prisma.providerProfile.delete({ where: { id: providerId } });

    return NextResponse.json({ success: true, data: { id: providerId } });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to delete provider" },
      { status: 500 }
    );
  }
}
