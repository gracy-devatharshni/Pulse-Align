import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AuditPageClient } from "@/components/audit/AuditPageClient";

export const metadata = { title: "Audit Trail" };

export default async function AuditRoute() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  return <AuditPageClient userRole={user.role} />;
}
