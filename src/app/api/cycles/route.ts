import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { cycleSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const cycles = await prisma.cycle.findMany({
      orderBy: { startDate: "desc" },
      include: { _count: { select: { goals: true } } },
    });

    return NextResponse.json(cycles);
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

    if (user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const parsed = cycleSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });

    // If setting active, deactivate all others
    if (parsed.data.isActive) {
      await prisma.cycle.updateMany({ data: { isActive: false } });
    }

    const cycle = await prisma.cycle.create({
      data: {
        name: parsed.data.name,
        year: parsed.data.year,
        startDate: new Date(parsed.data.startDate),
        endDate: new Date(parsed.data.endDate),
        isActive: parsed.data.isActive,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "CYCLE_CREATED",
        entity: "cycle",
        newValue: { name: cycle.name, year: cycle.year, isActive: cycle.isActive },
      },
    });

    return NextResponse.json(cycle, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
