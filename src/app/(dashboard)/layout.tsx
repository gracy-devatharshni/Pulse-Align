import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { syncUserWithClerk } from "@/lib/auth";
import { DashboardShell } from "@/components/layout/DashboardShell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await syncUserWithClerk();
  if (!user) redirect("/sign-in");

  return <DashboardShell user={user}>{children}</DashboardShell>;
}
