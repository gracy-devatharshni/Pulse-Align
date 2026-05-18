import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AdminUsersClient } from "@/components/admin/AdminUsersClient";

export const metadata = { title: "Admin — Users" };

export default async function AdminUsersRoute() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/dashboard");

  return <AdminUsersClient />;
}
