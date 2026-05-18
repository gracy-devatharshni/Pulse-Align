import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { checkInSchema } from "@/lib/validations";
import { calculateProgressScore } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const goalId = searchParams.get("goalId");
    const quarter = searchParams.get("quarter");

    const checkIns = await prisma.checkIn.findMany({
      where: {
        userId: user.id,
        ...(goalId ? { goalId } : {}),
        ...(quarter ? { quarter: quarter as any } : {}),
      },
      include: {
        goal: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(checkIns);
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

    const body = await req.json();
    const { goalId, ...checkInData } = body;

    if (!goalId) return NextResponse.json({ error: "goalId is required" }, { status: 400 });

    const parsed = checkInSchema.safeParse(checkInData);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });

    const goal = await prisma.goal.findUnique({ where: { id: goalId } });
    if (!goal) return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    if (!["APPROVED", "LOCKED"].includes(goal.status)) {
      return NextResponse.json({ error: "Goal must be approved to add check-ins" }, { status: 400 });
    }

    const progressScore = calculateProgressScore(
      goal.uom,
      goal.target,
      parsed.data.achievement,
      goal.isLowerBetter,
      parsed.data.completionDate ? new Date(parsed.data.completionDate) : null,
      goal.deadline
    );

    const checkIn = await prisma.checkIn.upsert({
      where: {
        goalId_quarter: {
          goalId,
          quarter: parsed.data.quarter,
        },
      },
      create: {
        goalId,
        userId: user.id,
        quarter: parsed.data.quarter,
        achievement: parsed.data.achievement,
        completionDate: parsed.data.completionDate ? new Date(parsed.data.completionDate) : null,
        status: parsed.data.status,
        progressScore,
      },
      update: {
        achievement: parsed.data.achievement,
        completionDate: parsed.data.completionDate ? new Date(parsed.data.completionDate) : null,
        status: parsed.data.status,
        progressScore,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        goalId,
        action: "CHECK_IN_UPDATED",
        entity: "check_in",
        newValue: {
          quarter: parsed.data.quarter,
          achievement: parsed.data.achievement,
          status: parsed.data.status,
          progressScore,
        },
      },
    });

    return NextResponse.json(checkIn, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
