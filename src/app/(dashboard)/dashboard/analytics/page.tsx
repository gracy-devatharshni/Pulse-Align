import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AnalyticsPageClient } from "@/components/analytics/AnalyticsPageClient";

export const metadata = { title: "Analytics" };

export default async function AnalyticsRoute() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  return <AnalyticsPageClient userRole={user.role} userId={user.id} />;
}
