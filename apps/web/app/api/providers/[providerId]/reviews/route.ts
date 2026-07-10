import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createProviderReviewSchema } from "@homeos/shared";

interface Context {
  params: Promise<{ providerId: string }>;
}

export async function GET(req: NextRequest, ctx: Context) {
  try {
    await requireAuth();
    const { providerId } = await ctx.params;

    const reviews = await prisma.providerReview.findMany({
      where: { providerId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: reviews });
  } catch {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }
}

export async function POST(req: NextRequest, ctx: Context) {
  try {
    const user = await requireAuth();
    const { providerId } = await ctx.params;
    const body = await req.json();

    const parsed = createProviderReviewSchema.safeParse({
      ...body,
      providerId,
    });
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message ?? "Validation failed" },
        { status: 400 }
      );
    }

    const provider = await prisma.providerProfile.findUnique({
      where: { id: providerId },
    });

    if (!provider) {
      return NextResponse.json(
        { success: false, error: "Provider not found" },
        { status: 404 }
      );
    }

    // Check if reviewer has a completed service request with this provider
    const completedRequest = await prisma.serviceRequest.findFirst({
      where: {
        providerId,
        status: "completed",
        home: { users: { some: { userId: user.id } } },
      },
    });

    const review = await prisma.providerReview.create({
      data: {
        providerId,
        userId: user.id,
        rating: parsed.data.rating,
        comment: parsed.data.comment,
        authorName: parsed.data.authorName,
        isVerified: !!completedRequest,
      },
    });

    // Recalculate provider's average rating and review count
    const aggregation = await prisma.providerReview.aggregate({
      where: { providerId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await prisma.providerProfile.update({
      where: { id: providerId },
      data: {
        rating: aggregation._avg.rating ?? 0,
        reviewCount: aggregation._count.rating,
      },
    });

    return NextResponse.json({ success: true, data: review }, { status: 201 });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to create review" },
      { status: 500 }
    );
  }
}
