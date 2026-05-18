import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { goalSchema } from "@/lib/validations";
import { z } from "zod";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const cycleId = searchParams.get("cycleId");
    const targetUserId = searchParams.get("userId");

    // Managers/Admins can query for other users
    let queryUserId = user.id;
    if (targetUserId && (user.role === "MANAGER" || user.role === "ADMIN")) {
      queryUserId = targetUserId;
    }

    const goals = await prisma.goal.findMany({
      where: {
        userId: queryUserId,
        ...(cycleId ? { cycleId } : {}),
      },
      include: {
        checkIns: { orderBy: { createdAt: "desc" } },
        cycle: true,
        parentGoal: true,
        childGoals: { include: { user: true } },
        user: { select: { id: true, name: true, email: true, department: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(goals);
  } catch (error) {
    console.error("GET /api/goals:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const body = await req.json();
    const parsed = goalSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    // Check goal count limit
    const existingCount = await prisma.goal.count({
      where: { userId: user.id, cycleId: parsed.data.cycleId },
    });
    if (existingCount >= 8) {
      return NextResponse.json({ error: "Maximum 8 goals allowed per cycle" }, { status: 400 });
    }

    const goal = await prisma.goal.create({
      data: {
        userId: user.id,
        cycleId: parsed.data.cycleId,
        thrustArea: parsed.data.thrustArea,
        title: parsed.data.title,
        description: parsed.data.description,
        uom: parsed.data.uom,
        target: parsed.data.target,
        weightage: parsed.data.weightage,
        deadline: new Date(parsed.data.deadline),
        isLowerBetter: parsed.data.isLowerBetter,
        status: "DRAFT",
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        goalId: goal.id,
        action: "GOAL_CREATED",
        entity: "goal",
        newValue: { title: goal.title, weightage: goal.weightage },
      },
    });

    return NextResponse.json(goal, { status: 201 });
  } catch (error) {
    console.error("POST /api/goals:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
