import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const sharedGoals = await prisma.goal.findMany({
      where: {
        isShared: true,
        OR: [
          { userId: user.id },
          { childGoals: { some: { userId: user.id } } },
        ],
      },
      include: {
        user: { select: { id: true, name: true, email: true, department: true } },
        childGoals: {
          include: {
            user: { select: { id: true, name: true, email: true } },
            checkIns: { orderBy: { createdAt: "desc" }, take: 1 },
          },
        },
        cycle: true,
        checkIns: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(sharedGoals);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    if (user.role !== "MANAGER" && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Only managers can create shared goals" }, { status: 403 });
    }

    const body = await req.json();
    const { targetUserIds, ...goalData } = body;

    if (!targetUserIds || targetUserIds.length === 0) {
      return NextResponse.json({ error: "At least one target user is required" }, { status: 400 });
    }

    // Create the parent shared goal
    const parentGoal = await prisma.goal.create({
      data: {
        userId: user.id,
        cycleId: goalData.cycleId,
        thrustArea: goalData.thrustArea,
        title: goalData.title,
        description: goalData.description,
        uom: goalData.uom,
        target: goalData.target,
        weightage: goalData.weightage,
        deadline: new Date(goalData.deadline),
        isShared: true,
        status: "DRAFT",
      },
    });

    // Create child goals for each target user
    const childGoals = await Promise.all(
      targetUserIds.map((targetUserId: string) =>
        prisma.goal.create({
          data: {
            userId: targetUserId,
            cycleId: goalData.cycleId,
            thrustArea: goalData.thrustArea,
            title: goalData.title,
            description: goalData.description,
            uom: goalData.uom,
            target: goalData.target,
            weightage: goalData.weightage || 10,
            deadline: new Date(goalData.deadline),
            isShared: true,
            parentGoalId: parentGoal.id,
            status: "DRAFT",
          },
        })
      )
    );

    // Notify target users
    await Promise.all(
      targetUserIds.map((targetUserId: string) =>
        prisma.notification.create({
          data: {
            userId: targetUserId,
            title: "Shared Goal Assigned",
            message: `"${goalData.title}" has been shared with you by ${user.name}.`,
            type: "info",
            link: "/dashboard/shared-goals",
          },
        })
      )
    );

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        goalId: parentGoal.id,
        action: "SHARED_GOAL_CREATED",
        entity: "goal",
        newValue: { title: parentGoal.title, targetCount: targetUserIds.length },
      },
    });

    return NextResponse.json({ parentGoal, childGoals }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
