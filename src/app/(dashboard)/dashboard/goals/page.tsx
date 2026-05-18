import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { GoalsPage } from "@/components/goals/GoalsPage";

export const metadata = { title: "My Goals" };

export default async function GoalsRoute() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const [goals, cycles] = await Promise.all([
    prisma.goal.findMany({
      where: { userId: user.id },
      include: {
        checkIns: { orderBy: { createdAt: "desc" } },
        cycle: true,
        parentGoal: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.cycle.findMany({ orderBy: { startDate: "desc" } }),
  ]);

  const serialized = {
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
    cycles: cycles.map((c) => ({
      ...c,
      startDate: c.startDate.toISOString(),
      endDate: c.endDate.toISOString(),
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    })),
    user: {
      ...user,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    },
  };

  return <GoalsPage data={serialized} />;
}
