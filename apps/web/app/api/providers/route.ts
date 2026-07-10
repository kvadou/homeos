import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createProviderSchema } from "@homeos/shared";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();

    const { searchParams } = new URL(req.url);
    const specialty = searchParams.get("specialty");
    const search = searchParams.get("search");

    const where: Record<string, unknown> = {};

    if (specialty) {
      where.specialty = specialty;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { company: { contains: search, mode: "insensitive" } },
      ];
    }

    const providers = await prisma.providerProfile.findMany({
      where,
      include: {
        _count: {
          select: {
            reviews: { where: { isVerified: true } },
          },
        },
      },
      orderBy: [{ featured: "desc" }, { rating: "desc" }, { reviewCount: "desc" }],
    });

    const data = providers.map(({ _count, ...p }) => ({
      ...p,
      verifiedReviewCount: _count.reviews,
    }));

    return NextResponse.json({
      success: true,
      data,
      meta: { currentUserId: user.id },
    });
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

    const parsed = createProviderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message ?? "Validation failed" },
        { status: 400 }
      );
    }

    const provider = await prisma.providerProfile.create({
      data: parsed.data,
    });

    return NextResponse.json({ success: true, data: provider }, { status: 201 });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to create provider" },
      { status: 500 }
    );
  }
}
