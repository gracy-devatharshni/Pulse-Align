import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { ReportsPageClient } from "@/components/reports/ReportsPageClient";

export const metadata = { title: "Reports" };

export default async function ReportsRoute() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  return <ReportsPageClient userRole={user.role} userId={user.id} />;
}
