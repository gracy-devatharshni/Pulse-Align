import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AdminCyclesClient } from "@/components/admin/AdminCyclesClient";

export const metadata = { title: "Admin — Cycles" };

export default async function AdminCyclesRoute() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/dashboard");

  return <AdminCyclesClient />;
}
