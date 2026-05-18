import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { SharedGoalsPageClient } from "@/components/goals/SharedGoalsPageClient";

export const metadata = { title: "Shared Goals" };

export default async function SharedGoalsRoute() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  // Get team members for manager/admin
  const teamMembers =
    user.role !== "EMPLOYEE"
      ? await prisma.user.findMany({
          where: user.role === "ADMIN" ? {} : { managerId: user.id },
          select: { id: true, name: true, email: true, department: true },
          orderBy: { name: "asc" },
        })
      : [];

  const cycles = await prisma.cycle.findMany({
    orderBy: { startDate: "desc" },
    take: 5,
  });

  const serialize = (obj: any): any => {
    if (obj === null || obj === undefined) return obj;
    if (obj instanceof Date) return obj.toISOString();
    if (Array.isArray(obj)) return obj.map(serialize);
    if (typeof obj === "object") return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, serialize(v)]));
    return obj;
  };

  return (
    <SharedGoalsPageClient
      userRole={user.role}
      userId={user.id}
      teamMembers={serialize(teamMembers)}
      cycles={serialize(cycles)}
    />
  );
}
