import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getUserHomeRole, requireOwner } from "@/lib/permissions";
import { inviteUserSchema } from "@homeos/shared";
import crypto from "crypto";

interface Context {
  params: Promise<{ homeId: string }>;
}

/**
 * GET /api/homes/[homeId]/members
 * List all members of a home. Requires membership.
 */
export async function GET(_req: NextRequest, ctx: Context) {
  try {
    const user = await requireAuth();
    const { homeId } = await ctx.params;

    // Verify the user is a member of this home
    const role = await getUserHomeRole(user.id, homeId);
    if (!role) {
      return NextResponse.json(
        { success: false, error: "Not a member of this home" },
        { status: 403 }
      );
    }

    const members = await prisma.homeUser.findMany({
      where: { homeId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            imageUrl: true,
          },
        },
      },
      orderBy: { user: { firstName: "asc" } },
    });

    // Also fetch pending invitations for this home (visible to all members)
    const pendingInvitations = await prisma.homeInvitation.findMany({
      where: { homeId, status: "pending" },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        expiresAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: { members, pendingInvitations, currentUserRole: role },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }
}

/**
 * POST /api/homes/[homeId]/members
 * Send an invitation to join a home. Only owners can invite.
 */
export async function POST(req: NextRequest, ctx: Context) {
  try {
    const user = await requireAuth();
    const { homeId } = await ctx.params;

    // Only owners can invite
    try {
      await requireOwner(user.id, homeId);
    } catch {
      return NextResponse.json(
        { success: false, error: "Only home owners can send invitations" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = inviteUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.errors[0]?.message ?? "Validation failed",
        },
        { status: 400 }
      );
    }

    const { email, role } = parsed.data;

    // Check if user is already a member (by email)
    const existingMember = await prisma.homeUser.findFirst({
      where: {
        homeId,
        user: { email },
      },
    });

    if (existingMember) {
      return NextResponse.json(
        { success: false, error: "This user is already a member of this home" },
        { status: 409 }
      );
    }

    // Check if there's already a pending invitation for this email
    const existingInvitation = await prisma.homeInvitation.findFirst({
      where: {
        homeId,
        email,
        status: "pending",
      },
    });

    if (existingInvitation) {
      return NextResponse.json(
        {
          success: false,
          error: "An invitation is already pending for this email",
        },
        { status: 409 }
      );
    }

    // Create the invitation
    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invitation = await prisma.homeInvitation.create({
      data: {
        homeId,
        email,
        role,
        token,
        invitedBy: user.id,
        expiresAt,
      },
    });

    return NextResponse.json(
      { success: true, data: invitation },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to send invitation" },
      { status: 500 }
    );
  }
}
