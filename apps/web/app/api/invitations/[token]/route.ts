import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { respondInvitationSchema } from "@homeos/shared";

interface Context {
  params: Promise<{ token: string }>;
}

/**
 * POST /api/invitations/[token]
 * Accept or decline an invitation.
 */
export async function POST(req: NextRequest, ctx: Context) {
  try {
    const user = await requireAuth();
    const { token } = await ctx.params;

    const body = await req.json();
    const parsed = respondInvitationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.errors[0]?.message ?? "Validation failed",
        },
        { status: 400 }
      );
    }

    const { action } = parsed.data;

    // Find the invitation
    const invitation = await prisma.homeInvitation.findUnique({
      where: { token },
      include: { home: { select: { id: true, name: true } } },
    });

    if (!invitation) {
      return NextResponse.json(
        { success: false, error: "Invitation not found" },
        { status: 404 }
      );
    }

    // Only the invited user can respond
    if (invitation.email !== user.email) {
      return NextResponse.json(
        { success: false, error: "This invitation is not for you" },
        { status: 403 }
      );
    }

    // Check if already responded
    if (invitation.status !== "pending") {
      return NextResponse.json(
        { success: false, error: `Invitation already ${invitation.status}` },
        { status: 400 }
      );
    }

    // Check if expired
    if (new Date() > invitation.expiresAt) {
      // Mark as expired
      await prisma.homeInvitation.update({
        where: { id: invitation.id },
        data: { status: "expired" },
      });

      return NextResponse.json(
        { success: false, error: "This invitation has expired" },
        { status: 410 }
      );
    }

    if (action === "decline") {
      await prisma.homeInvitation.update({
        where: { id: invitation.id },
        data: { status: "declined" },
      });

      return NextResponse.json({
        success: true,
        data: { action: "declined", homeName: invitation.home.name },
      });
    }

    // action === "accept"
    // Check if already a member (edge case)
    const existingMembership = await prisma.homeUser.findUnique({
      where: {
        userId_homeId: { userId: user.id, homeId: invitation.homeId },
      },
    });

    if (existingMembership) {
      // Already a member — mark invitation as accepted anyway
      await prisma.homeInvitation.update({
        where: { id: invitation.id },
        data: { status: "accepted" },
      });

      return NextResponse.json({
        success: true,
        data: {
          action: "accepted",
          homeName: invitation.home.name,
          alreadyMember: true,
        },
      });
    }

    // Create membership and update invitation in a transaction
    await prisma.$transaction([
      prisma.homeUser.create({
        data: {
          userId: user.id,
          homeId: invitation.homeId,
          role: invitation.role,
        },
      }),
      prisma.homeInvitation.update({
        where: { id: invitation.id },
        data: { status: "accepted" },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        action: "accepted",
        homeId: invitation.homeId,
        homeName: invitation.home.name,
        role: invitation.role,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to respond to invitation" },
      { status: 500 }
    );
  }
}
