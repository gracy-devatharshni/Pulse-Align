import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const goal = await prisma.goal.findUnique({ where: { id } });
    if (!goal) return NextResponse.json({ error: "Goal not found" }, { status: 404 });

    if (goal.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (!["DRAFT", "REWORK"].includes(goal.status)) {
      return NextResponse.json({ error: "Goal cannot be submitted in current state" }, { status: 400 });
    }

    const allGoals = await prisma.goal.findMany({
      where: { userId: user.id, cycleId: goal.cycleId },
    });
    const total = allGoals.reduce((sum, g) => sum + g.weightage, 0);
    if (Math.abs(total - 100) > 0.01) {
      return NextResponse.json(
        { error: `Total weightage must be 100%. Current: ${total}%` },
        { status: 400 }
      );
    }

    await prisma.goal.updateMany({
      where: { userId: user.id, cycleId: goal.cycleId, status: { in: ["DRAFT", "REWORK"] } },
      data: { status: "SUBMITTED" },
    });

    if (user.managerId) {
      await prisma.notification.create({
        data: {
          userId: user.managerId,
          title: "New Goal Submission",
          message: `${user.name} has submitted their goals for review.`,
          type: "approval",
          link: `/dashboard/approvals`,
        },
      });
    }

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        goalId: goal.id,
        action: "GOALS_SUBMITTED",
        entity: "goal",
        newValue: { cycleId: goal.cycleId, count: allGoals.length },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
