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

    if (user.role !== "MANAGER" && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get all employees under this manager (or all for admin)
    const teamGoals = await prisma.goal.findMany({
      where: {
        status: "SUBMITTED",
        ...(user.role === "MANAGER"
          ? { user: { managerId: user.id } }
          : {}),
      },
      include: {
        user: { select: { id: true, name: true, email: true, department: true } },
        cycle: true,
        checkIns: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    // Group by employee
    const grouped = teamGoals.reduce((acc: any, goal) => {
      const empId = goal.userId;
      if (!acc[empId]) {
        acc[empId] = {
          user: goal.user,
          cycle: goal.cycle,
          goals: [],
        };
      }
      acc[empId].goals.push(goal);
      return acc;
    }, {});

    return NextResponse.json(Object.values(grouped));
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
