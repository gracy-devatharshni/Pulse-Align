import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { syncUserWithClerk } from "@/lib/auth";
import { DashboardOverview } from "@/components/dashboard/DashboardOverview";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await syncUserWithClerk();
  if (!user) redirect("/sign-in");

  // Fetch all data needed for dashboard
  const [activeCycle, goals, checkIns, notifications, pendingApprovals] = await Promise.all([
    prisma.cycle.findFirst({ where: { isActive: true } }),
    prisma.goal.findMany({
      where: { userId: user.id, cycle: { isActive: true } },
      include: { checkIns: true, cycle: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.checkIn.findMany({
      where: { userId: user.id },
      include: { goal: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.notification.findMany({
      where: { userId: user.id, read: false },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    user.role !== "EMPLOYEE"
      ? prisma.goal.count({
          where: {
            status: "SUBMITTED",
            user: { managerId: user.id },
          },
        })
      : Promise.resolve(0),
  ]);

  const serialized = {
    user: {
      ...user,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    },
    activeCycle: activeCycle
      ? {
          ...activeCycle,
          startDate: activeCycle.startDate.toISOString(),
          endDate: activeCycle.endDate.toISOString(),
          createdAt: activeCycle.createdAt.toISOString(),
          updatedAt: activeCycle.updatedAt.toISOString(),
        }
      : null,
    goals: goals.map((g) => ({
      ...g,
      deadline: g.deadline.toISOString(),
      createdAt: g.createdAt.toISOString(),
      updatedAt: g.updatedAt.toISOString(),
      cycle: {
        ...g.cycle,
        startDate: g.cycle.startDate.toISOString(),
        endDate: g.cycle.endDate.toISOString(),
        createdAt: g.cycle.createdAt.toISOString(),
        updatedAt: g.cycle.updatedAt.toISOString(),
      },
      checkIns: g.checkIns.map((ci) => ({
        ...ci,
        completionDate: ci.completionDate?.toISOString() ?? null,
        createdAt: ci.createdAt.toISOString(),
        updatedAt: ci.updatedAt.toISOString(),
      })),
    })),
    notifications: notifications.map((n) => ({
      ...n,
      createdAt: n.createdAt.toISOString(),
    })),
    pendingApprovals,
  };

  return <DashboardOverview data={serialized} />;
}
