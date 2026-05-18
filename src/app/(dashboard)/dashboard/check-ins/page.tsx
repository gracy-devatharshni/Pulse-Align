import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { CheckInsPage } from "@/components/checkins/CheckInsPage";

export const metadata = { title: "Check-ins" };

export default async function CheckInsRoute() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const goals = await prisma.goal.findMany({
    where: {
      userId: user.id,
      status: { in: ["APPROVED", "LOCKED"] },
    },
    include: {
      checkIns: { orderBy: { quarter: "asc" } },
      cycle: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const serialize = (obj: any): any => {
    if (obj === null || obj === undefined) return obj;
    if (obj instanceof Date) return obj.toISOString();
    if (Array.isArray(obj)) return obj.map(serialize);
    if (typeof obj === "object") return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, serialize(v)]));
    return obj;
  };

  return <CheckInsPage goals={serialize(goals)} userId={user.id} />;
}
