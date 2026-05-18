"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Target, CheckSquare, BarChart3,
  FileText, Clock, Users, Shield, Settings, ChevronLeft,
  Zap, Building2, GitBranch, Share2
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/cn";

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
  badge?: number;
  roles?: string[];
}

const navItems: NavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: <LayoutDashboard className="w-4 h-4" />,
    href: "/dashboard",
  },
  {
    id: "goals",
    label: "My Goals",
    icon: <Target className="w-4 h-4" />,
    href: "/dashboard/goals",
  },
  {
    id: "check-ins",
    label: "Check-ins",
    icon: <CheckSquare className="w-4 h-4" />,
    href: "/dashboard/check-ins",
  },
  {
    id: "shared-goals",
    label: "Shared Goals",
    icon: <Share2 className="w-4 h-4" />,
    href: "/dashboard/shared-goals",
  },
  {
    id: "analytics",
    label: "Analytics",
    icon: <BarChart3 className="w-4 h-4" />,
    href: "/dashboard/analytics",
  },
  {
    id: "reports",
    label: "Reports",
    icon: <FileText className="w-4 h-4" />,
    href: "/dashboard/reports",
  },
  {
    id: "audit",
    label: "Audit Trail",
    icon: <Clock className="w-4 h-4" />,
    href: "/dashboard/audit",
  },
];

const managerItems: NavItem[] = [
  {
    id: "approvals",
    label: "Approvals",
    icon: <Shield className="w-4 h-4" />,
    href: "/dashboard/approvals",
    roles: ["MANAGER", "ADMIN"],
  },
  {
    id: "team",
    label: "Team Overview",
    icon: <Users className="w-4 h-4" />,
    href: "/dashboard/team",
    roles: ["MANAGER", "ADMIN"],
  },
];

const adminItems: NavItem[] = [
  {
    id: "admin-users",
    label: "Users",
    icon: <Users className="w-4 h-4" />,
    href: "/dashboard/admin/users",
    roles: ["ADMIN"],
  },
  {
    id: "admin-cycles",
    label: "Cycles",
    icon: <GitBranch className="w-4 h-4" />,
    href: "/dashboard/admin/cycles",
    roles: ["ADMIN"],
  },
  {
    id: "admin-org",
    label: "Organization",
    icon: <Building2 className="w-4 h-4" />,
    href: "/dashboard/admin/organization",
    roles: ["ADMIN"],
  },
  {
    id: "settings",
    label: "Settings",
    icon: <Settings className="w-4 h-4" />,
    href: "/dashboard/settings",
    roles: ["ADMIN"],
  },
];

interface SidebarProps {
  userRole: string;
}

export function Sidebar({ userRole }: SidebarProps) {
  const { sidebarOpen, toggleSidebar } = useAppStore();
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  const renderNavItem = (item: NavItem) => (
    <Link key={item.id} href={item.href} className={cn("nav-item", isActive(item.href) && "active")}>
      <span className="flex-shrink-0">{item.icon}</span>
      <AnimatePresence>
        {sidebarOpen && (
          <motion.span
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "auto" }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.2 }}
            className="truncate"
          >
            {item.label}
          </motion.span>
        )}
      </AnimatePresence>
      {item.badge && sidebarOpen && (
        <span className="ml-auto bg-foreground text-background text-xs rounded-full px-1.5 py-0.5 font-mono min-w-5 text-center">
          {item.badge}
        </span>
      )}
    </Link>
  );

  return (
    <motion.aside
      className={cn(
        "sidebar fixed left-0 top-0 h-screen z-40 bg-card border-r border-border flex flex-col overflow-hidden"
      )}
      animate={{ width: sidebarOpen ? "var(--sidebar-width)" : "var(--sidebar-collapsed-width)" }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-border h-16">
        <div className="w-8 h-8 bg-foreground rounded-lg flex items-center justify-center flex-shrink-0">
          <Zap className="w-4 h-4 text-background" />
        </div>
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="font-display font-bold text-foreground text-base leading-tight">PulseAlign</div>
              <div className="text-xs text-muted-foreground">Goal Alignment Hub</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 space-y-0.5">
        {/* Core Nav */}
        {sidebarOpen && <div className="nav-section-title">Workspace</div>}
        {navItems.map(renderNavItem)}

        {/* Manager Nav */}
        {(userRole === "MANAGER" || userRole === "ADMIN") && (
          <>
            {sidebarOpen && <div className="nav-section-title">Management</div>}
            {managerItems.map(renderNavItem)}
          </>
        )}

        {/* Admin Nav */}
        {userRole === "ADMIN" && (
          <>
            {sidebarOpen && <div className="nav-section-title">Administration</div>}
            {adminItems.map(renderNavItem)}
          </>
        )}
      </nav>

      {/* Collapse Toggle */}
      <div className="p-2 border-t border-border">
        <button
          onClick={toggleSidebar}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground text-sm"
        >
          <motion.div
            animate={{ rotate: sidebarOpen ? 0 : 180 }}
            transition={{ duration: 0.3 }}
          >
            <ChevronLeft className="w-4 h-4" />
          </motion.div>
          <AnimatePresence>
            {sidebarOpen && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-xs font-medium"
              >
                Collapse
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.aside>
  );
}
