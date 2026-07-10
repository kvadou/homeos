import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateClaimNarrative } from "@homeos/ai";

interface Context {
  params: Promise<{ claimId: string }>;
}

export async function POST(req: NextRequest, ctx: Context) {
  try {
    const user = await requireAuth();
    const { claimId } = await ctx.params;

    const claim = await prisma.insuranceClaim.findFirst({
      where: {
        id: claimId,
        home: { users: { some: { userId: user.id } } },
      },
    });

    if (!claim) {
      return NextResponse.json(
        { success: false, error: "Claim not found" },
        { status: 404 }
      );
    }

    // Fetch the items associated with this claim
    const itemIds = (claim.itemIds as string[]) ?? [];
    const items =
      itemIds.length > 0
        ? await prisma.item.findMany({
            where: { id: { in: itemIds } },
            select: {
              name: true,
              brand: true,
              model: true,
              purchasePrice: true,
              photoUrl: true,
            },
          })
        : [];

    const narrative = await generateClaimNarrative(
      items.map((i) => ({
        name: i.name,
        brand: i.brand,
        model: i.model,
        purchasePrice: i.purchasePrice ? Number(i.purchasePrice) : null,
        photoUrl: i.photoUrl,
      })),
      claim.description ?? "No description provided",
      claim.incidentType
    );

    // Save narrative to the claim
    await prisma.insuranceClaim.update({
      where: { id: claimId },
      data: { aiNarrative: narrative },
    });

    return NextResponse.json({ success: true, data: { narrative } });
  } catch (error) {
    console.error("Failed to generate claim narrative:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate narrative" },
      { status: 500 }
    );
  }
}
