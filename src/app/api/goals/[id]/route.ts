import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { goalSchema } from "@/lib/validations";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const goal = await prisma.goal.findUnique({
      where: { id },
      include: {
        checkIns: { orderBy: { createdAt: "desc" } },
        cycle: true,
        parentGoal: true,
        childGoals: { include: { user: { select: { id: true, name: true } } } },
        user: { select: { id: true, name: true, email: true } },
        auditLogs: {
          orderBy: { createdAt: "desc" },
          include: { user: { select: { id: true, name: true } } },
        },
      },
    });

    if (!goal) return NextResponse.json({ error: "Goal not found" }, { status: 404 });

    if (goal.userId !== user.id && user.role === "EMPLOYEE") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(goal);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const goal = await prisma.goal.findUnique({ where: { id } });
    if (!goal) return NextResponse.json({ error: "Goal not found" }, { status: 404 });

    if (goal.userId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (goal.status === "LOCKED" && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Goal is locked. Contact admin to unlock." }, { status: 400 });
    }
    if (["APPROVED", "SUBMITTED"].includes(goal.status) && user.role === "EMPLOYEE") {
      return NextResponse.json({ error: "Cannot edit after submission" }, { status: 400 });
    }

    const body = await req.json();
    const parsed = goalSchema.partial().safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });

    const prevValues = { title: goal.title, weightage: goal.weightage, target: goal.target, status: goal.status };

    const updated = await prisma.goal.update({
      where: { id },
      data: {
        ...(parsed.data.thrustArea && { thrustArea: parsed.data.thrustArea }),
        ...(parsed.data.title && { title: parsed.data.title }),
        ...(parsed.data.description !== undefined && { description: parsed.data.description }),
        ...(parsed.data.uom && { uom: parsed.data.uom }),
        ...(parsed.data.target !== undefined && { target: parsed.data.target }),
        ...(parsed.data.weightage !== undefined && { weightage: parsed.data.weightage }),
        ...(parsed.data.deadline && { deadline: new Date(parsed.data.deadline) }),
        ...(parsed.data.isLowerBetter !== undefined && { isLowerBetter: parsed.data.isLowerBetter }),
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        goalId: goal.id,
        action: "GOAL_UPDATED",
        entity: "goal",
        prevValue: prevValues,
        newValue: { title: updated.title, weightage: updated.weightage, target: updated.target },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const goal = await prisma.goal.findUnique({ where: { id } });
    if (!goal) return NextResponse.json({ error: "Goal not found" }, { status: 404 });

    if (goal.userId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (!["DRAFT", "REWORK"].includes(goal.status)) {
      return NextResponse.json({ error: "Can only delete draft or rework goals" }, { status: 400 });
    }

    await prisma.goal.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        goalId: null,
        action: "GOAL_DELETED",
        entity: "goal",
        prevValue: { title: goal.title, goalId: goal.id },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
