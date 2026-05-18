"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { CommandPalette } from "@/components/ui/CommandPalette";
import { useAppStore } from "@/store/useAppStore";

interface DashboardShellProps {
  children: React.ReactNode;
  user: {
    id: string;
    clerkId: string;
    email: string;
    name: string;
    role: "EMPLOYEE" | "MANAGER" | "ADMIN";
    department?: string | null;
    designation?: string | null;
    managerId?: string | null;
  };
}

export function DashboardShell({ children, user }: DashboardShellProps) {
  const { setUser, sidebarOpen } = useAppStore();

  useEffect(() => {
    setUser(user);
  }, [user, setUser]);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar userRole={user.role} />
      <Navbar />
      <motion.main
        className="min-h-screen transition-all duration-300"
        style={{
          paddingLeft: sidebarOpen ? "var(--sidebar-width)" : "var(--sidebar-collapsed-width)",
          paddingTop: "var(--navbar-height)",
        }}
        layout
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      >
        <div className="p-6 lg:p-8 animate-page">
          {children}
        </div>
      </motion.main>
      <CommandPalette />
    </div>
  );
}
