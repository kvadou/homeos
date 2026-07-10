import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { updateServiceRequestSchema } from "@homeos/shared";

interface Context {
  params: Promise<{ requestId: string }>;
}

export async function GET(req: NextRequest, ctx: Context) {
  try {
    const user = await requireAuth();
    const { requestId } = await ctx.params;

    const userHomes = await prisma.homeUser.findMany({
      where: { userId: user.id },
      select: { homeId: true },
    });
    const homeIds = userHomes.map((h) => h.homeId);

    const serviceRequest = await prisma.serviceRequest.findFirst({
      where: {
        id: requestId,
        homeId: { in: homeIds },
      },
      include: {
        provider: true,
        home: { select: { id: true, name: true } },
      },
    });

    if (!serviceRequest) {
      return NextResponse.json(
        { success: false, error: "Service request not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: serviceRequest });
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
    const { requestId } = await ctx.params;
    const body = await req.json();

    const userHomes = await prisma.homeUser.findMany({
      where: { userId: user.id },
      select: { homeId: true },
    });
    const homeIds = userHomes.map((h) => h.homeId);

    const existing = await prisma.serviceRequest.findFirst({
      where: {
        id: requestId,
        homeId: { in: homeIds },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Service request not found" },
        { status: 404 }
      );
    }

    const parsed = updateServiceRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message ?? "Validation failed" },
        { status: 400 }
      );
    }

    const data: Record<string, unknown> = { ...parsed.data };
    if (parsed.data.scheduledAt) {
      data.scheduledAt = new Date(parsed.data.scheduledAt);
    }
    if (parsed.data.completedAt) {
      data.completedAt = new Date(parsed.data.completedAt);
    }

    const serviceRequest = await prisma.serviceRequest.update({
      where: { id: requestId },
      data,
      include: {
        provider: true,
        home: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ success: true, data: serviceRequest });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to update service request" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, ctx: Context) {
  try {
    const user = await requireAuth();
    const { requestId } = await ctx.params;

    const userHomes = await prisma.homeUser.findMany({
      where: { userId: user.id },
      select: { homeId: true },
    });
    const homeIds = userHomes.map((h) => h.homeId);

    const existing = await prisma.serviceRequest.findFirst({
      where: {
        id: requestId,
        homeId: { in: homeIds },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Service request not found" },
        { status: 404 }
      );
    }

    await prisma.serviceRequest.delete({ where: { id: requestId } });

    return NextResponse.json({ success: true, data: { id: requestId } });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to delete service request" },
      { status: 500 }
    );
  }
}
