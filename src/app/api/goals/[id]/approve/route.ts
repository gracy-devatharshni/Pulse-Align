import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { managerApprovalSchema } from "@/lib/validations";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    if (user.role !== "MANAGER" && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Only managers can approve goals" }, { status: 403 });
    }

    const goal = await prisma.goal.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!goal) return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    if (goal.status !== "SUBMITTED") {
      return NextResponse.json({ error: "Goal is not in submitted state" }, { status: 400 });
    }

    const body = await req.json();
    const parsed = managerApprovalSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });

    const { status, managerComment, goals: goalUpdates } = parsed.data;

    if (goalUpdates && goalUpdates.length > 0) {
      for (const update of goalUpdates) {
        await prisma.goal.update({
          where: { id: update.id },
          data: {
            ...(update.target !== undefined && { target: update.target }),
            ...(update.weightage !== undefined && { weightage: update.weightage }),
          },
        });
      }
    }

    const newStatus = status === "APPROVED" ? "LOCKED" : status === "REJECTED" ? "REJECTED" : "REWORK";

    await prisma.goal.updateMany({
      where: { userId: goal.userId, cycleId: goal.cycleId, status: "SUBMITTED" },
      data: { status: newStatus, managerComment: managerComment || null },
    });

    await prisma.notification.create({
      data: {
        userId: goal.userId,
        title: `Goals ${status === "APPROVED" ? "Approved" : status === "REJECTED" ? "Rejected" : "Returned for Rework"}`,
        message: managerComment || `Your goals have been ${status.toLowerCase()}.`,
        type: status === "APPROVED" ? "success" : status === "REJECTED" ? "error" : "warning",
        link: `/dashboard/goals`,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        goalId: goal.id,
        action: `GOALS_${status}`,
        entity: "approval",
        prevValue: { status: "SUBMITTED" },
        newValue: { status: newStatus, managerComment },
      },
    });

    return NextResponse.json({ success: true, status: newStatus });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
