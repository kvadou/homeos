import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createServiceRequestSchema } from "@homeos/shared";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();

    const { searchParams } = new URL(req.url);
    const homeId = searchParams.get("homeId");
    const status = searchParams.get("status");

    // Get user's home IDs for scoping
    const userHomes = await prisma.homeUser.findMany({
      where: { userId: user.id },
      select: { homeId: true },
    });
    const homeIds = userHomes.map((h) => h.homeId);

    const where: Record<string, unknown> = {
      homeId: homeId ? { in: homeIds, equals: homeId } : { in: homeIds },
    };

    if (status) {
      where.status = status;
    }

    const requests = await prisma.serviceRequest.findMany({
      where,
      include: {
        provider: true,
        home: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: requests });
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

    const parsed = createServiceRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message ?? "Validation failed" },
        { status: 400 }
      );
    }

    // Verify home ownership
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

    const serviceRequest = await prisma.serviceRequest.create({
      data: {
        homeId: parsed.data.homeId,
        providerId: parsed.data.providerId,
        title: parsed.data.title,
        description: parsed.data.description,
        priority: parsed.data.priority,
        scheduledAt: parsed.data.scheduledAt ? new Date(parsed.data.scheduledAt) : undefined,
      },
      include: {
        provider: true,
        home: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ success: true, data: serviceRequest }, { status: 201 });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to create service request" },
      { status: 500 }
    );
  }
}
