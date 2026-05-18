"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import { motion } from "framer-motion";
import {
  Bell, Search, Command, ChevronRight
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useAppStore } from "@/store/useAppStore";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/cn";

function getBreadcrumbs(pathname: string): { label: string; href: string }[] {
  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs: { label: string; href: string }[] = [];
  let currentPath = "";

  const labels: Record<string, string> = {
    dashboard: "Dashboard",
    goals: "Goals",
    "check-ins": "Check-ins",
    analytics: "Analytics",
    reports: "Reports",
    audit: "Audit Trail",
    approvals: "Approvals",
    team: "Team",
    admin: "Admin",
    users: "Users",
    cycles: "Cycles",
    organization: "Organization",
    settings: "Settings",
    "shared-goals": "Shared Goals",
    new: "New",
  };

  for (const segment of segments) {
    currentPath += `/${segment}`;
    breadcrumbs.push({
      label: labels[segment] || segment,
      href: currentPath,
    });
  }

  return breadcrumbs;
}

export function Navbar() {
  const { user } = useUser();
  const { sidebarOpen, unreadCount, setCommandPaletteOpen } = useAppStore();
  const pathname = usePathname();
  const breadcrumbs = getBreadcrumbs(pathname);

  const roleColor: Record<string, string> = {
    EMPLOYEE: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    MANAGER: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    ADMIN: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  };

  return (
    <header
      className="fixed top-0 right-0 h-16 bg-card/80 backdrop-blur-md border-b border-border z-30 flex items-center px-6 gap-4"
      style={{
        left: sidebarOpen ? "var(--sidebar-width)" : "var(--sidebar-collapsed-width)",
        transition: "left 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      {/* Breadcrumbs */}
      <div className="flex items-center gap-1.5 text-sm flex-1 min-w-0">
        {breadcrumbs.map((crumb, idx) => (
          <div key={crumb.href} className="flex items-center gap-1.5 min-w-0">
            {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />}
            {idx === breadcrumbs.length - 1 ? (
              <span className="font-display font-semibold text-foreground truncate">
                {crumb.label}
              </span>
            ) : (
              <Link
                href={crumb.href}
                className="text-muted-foreground hover:text-foreground transition-colors animated-underline truncate"
              >
                {crumb.label}
              </Link>
            )}
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Search / Command Palette */}
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors text-sm"
        >
          <Search className="w-3.5 h-3.5" />
          <span>Search</span>
          <div className="flex items-center gap-0.5 ml-2">
            <kbd className="px-1.5 py-0.5 text-xs rounded bg-muted font-mono">⌘</kbd>
            <kbd className="px-1.5 py-0.5 text-xs rounded bg-muted font-mono">K</kbd>
          </div>
        </button>

        <ThemeToggle />

        {/* Notifications */}
        <Link
          href="/dashboard/notifications"
          className="relative w-9 h-9 rounded-lg flex items-center justify-center hover:bg-accent transition-colors"
        >
          <Bell className="w-4 h-4 text-foreground" />
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-foreground text-background text-xs rounded-full flex items-center justify-center font-mono font-bold"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </motion.span>
          )}
        </Link>

        {/* User Button */}
        <UserButton
          appearance={{
            elements: {
              avatarBox: "w-8 h-8 rounded-lg",
            },
          }}
        />
      </div>
    </header>
  );
}
