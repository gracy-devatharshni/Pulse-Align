import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { calculateProgressScore } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const cycleId = searchParams.get("cycleId");

    // Role-based data scope
    const usersQuery =
      user.role === "ADMIN"
        ? {}
        : user.role === "MANAGER"
        ? { OR: [{ id: user.id }, { managerId: user.id }] }
        : { id: user.id };

    const users = await prisma.user.findMany({
      where: usersQuery,
      include: {
        goals: {
          where: {
            ...(cycleId ? { cycleId } : { cycle: { isActive: true } }),
          },
          include: { checkIns: true },
        },
      },
    });

    // Calculate analytics
    const analytics = users.map((u) => {
      const goals = u.goals;
      const totalGoals = goals.length;
      const approvedGoals = goals.filter((g) =>
        ["APPROVED", "LOCKED"].includes(g.status)
      );
      const submittedGoals = goals.filter((g) => g.status === "SUBMITTED");

      const overallScore =
        approvedGoals.length > 0
          ? approvedGoals.reduce((sum, g) => {
              const latestCheckIn = g.checkIns[g.checkIns.length - 1];
              const score = latestCheckIn
                ? calculateProgressScore(
                    g.uom,
                    g.target,
                    latestCheckIn.achievement,
                    g.isLowerBetter
                  )
                : 0;
              return sum + score * (g.weightage / 100);
            }, 0)
          : 0;

      return {
        userId: u.id,
        name: u.name,
        email: u.email,
        department: u.department,
        designation: u.designation,
        totalGoals,
        approvedGoals: approvedGoals.length,
        submittedGoals: submittedGoals.length,
        overallScore: Math.round(overallScore),
        goalsByStatus: goals.reduce((acc: any, g) => {
          acc[g.status] = (acc[g.status] || 0) + 1;
          return acc;
        }, {}),
        quarterlyScores: ["Q1", "Q2", "Q3", "Q4"].map((q) => {
          const checkIns = goals.flatMap((g) =>
            g.checkIns.filter((ci) => ci.quarter === q)
          );
          const avgScore =
            checkIns.length > 0
              ? checkIns.reduce((sum, ci) => sum + (ci.progressScore || 0), 0) /
                checkIns.length
              : 0;
          return { quarter: q, score: Math.round(avgScore) };
        }),
      };
    });

    // Org-wide stats
    const orgStats = {
      totalUsers: analytics.length,
      avgScore:
        analytics.length > 0
          ? Math.round(
              analytics.reduce((sum, a) => sum + a.overallScore, 0) /
                analytics.length
            )
          : 0,
      completionRate:
        analytics.length > 0
          ? Math.round(
              (analytics.filter((a) => a.overallScore >= 80).length /
                analytics.length) *
                100
            )
          : 0,
      topPerformers: analytics
        .sort((a, b) => b.overallScore - a.overallScore)
        .slice(0, 5),
      departmentPerformance: Object.entries(
        analytics.reduce((acc: any, a) => {
          const dept = a.department || "Unassigned";
          if (!acc[dept]) acc[dept] = { total: 0, count: 0 };
          acc[dept].total += a.overallScore;
          acc[dept].count += 1;
          return acc;
        }, {})
      ).map(([dept, data]: any) => ({
        department: dept,
        avgScore: Math.round(data.total / data.count),
        count: data.count,
      })),
    };

    return NextResponse.json({ analytics, orgStats });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
