import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { ApprovalsPage } from "@/components/manager/ApprovalsPage";

export const metadata = { title: "Approvals" };

export default async function ApprovalsRoute() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await getCurrentUser();
  if (!user || (user.role !== "MANAGER" && user.role !== "ADMIN")) {
    redirect("/dashboard");
  }

  const submissions = await prisma.goal.findMany({
    where: {
      status: "SUBMITTED",
      ...(user.role === "MANAGER" ? { user: { managerId: user.id } } : {}),
    },
    include: {
      user: { select: { id: true, name: true, email: true, department: true, designation: true } },
      cycle: true,
      checkIns: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  // Group by employee + cycle
  const grouped = submissions.reduce((acc: any, goal: any) => {
    const key = `${goal.userId}-${goal.cycleId}`;
    if (!acc[key]) {
      acc[key] = { user: goal.user, cycle: goal.cycle, goals: [] };
    }
    acc[key].goals.push(goal);
    return acc;
  }, {});

  const history = await prisma.goal.findMany({
    where: {
      status: { in: ["LOCKED", "APPROVED", "REJECTED", "REWORK"] },
      ...(user.role === "MANAGER" ? { user: { managerId: user.id } } : {}),
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
      cycle: true,
    },
    orderBy: { updatedAt: "desc" },
    take: 20,
  });

  const serialize = (obj: any): any => {
    if (obj === null || obj === undefined) return obj;
    if (obj instanceof Date) return obj.toISOString();
    if (Array.isArray(obj)) return obj.map(serialize);
    if (typeof obj === "object") {
      return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, serialize(v)]));
    }
    return obj;
  };

  return (
    <ApprovalsPage
      pending={serialize(Object.values(grouped))}
      history={serialize(history)}
      managerName={user.name}
    />
  );
}
