import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "./db";
import { Role } from "@prisma/client";

export async function getCurrentUser() {
  const { userId } = await auth();
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: { manager: true },
  });

  return user;
}

export async function requireAuth() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  return userId;
}

export async function requireRole(requiredRole: Role) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const roleHierarchy = { EMPLOYEE: 0, MANAGER: 1, ADMIN: 2 };
  if (roleHierarchy[user.role] < roleHierarchy[requiredRole]) {
    throw new Error("Forbidden: Insufficient permissions");
  }

  return user;
}

export async function syncUserWithClerk() {
  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const email = clerkUser.emailAddresses[0]?.emailAddress || "";
  const name = `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim();

  const user = await prisma.user.upsert({
    where: { clerkId: clerkUser.id },
    update: { email, name },
    create: {
      clerkId: clerkUser.id,
      email,
      name,
      role: "EMPLOYEE",
    },
  });

  return user;
}
