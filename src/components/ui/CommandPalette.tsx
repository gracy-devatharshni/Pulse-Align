"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Target, Users, BarChart3, Settings, Search,
  Home, CheckSquare, Clock, FileText, Shield, X
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { useUser } from "@clerk/nextjs";

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  href: string;
  shortcut?: string;
}

export function CommandPalette() {
  const { commandPaletteOpen, setCommandPaletteOpen, user } = useAppStore();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = ([""]) as any;

  const allCommands: CommandItem[] = [
    { id: "home", label: "Dashboard", description: "Go to your dashboard", icon: <Home className="w-4 h-4" />, href: "/dashboard" },
    { id: "goals", label: "My Goals", description: "View and manage goals", icon: <Target className="w-4 h-4" />, href: "/dashboard/goals" },
    { id: "checkins", label: "Check-ins", description: "Quarterly progress updates", icon: <CheckSquare className="w-4 h-4" />, href: "/dashboard/check-ins" },
    { id: "analytics", label: "Analytics", description: "Performance analytics", icon: <BarChart3 className="w-4 h-4" />, href: "/dashboard/analytics" },
    { id: "reports", label: "Reports", description: "Export and view reports", icon: <FileText className="w-4 h-4" />, href: "/dashboard/reports" },
    { id: "audit", label: "Audit Trail", description: "View audit logs", icon: <Clock className="w-4 h-4" />, href: "/dashboard/audit" },
  ];

  if (user?.role === "MANAGER" || user?.role === "ADMIN") {
    allCommands.push(
      { id: "approvals", label: "Approvals", description: "Pending approvals", icon: <Shield className="w-4 h-4" />, href: "/dashboard/approvals" },
      { id: "team", label: "Team Overview", description: "Your team's progress", icon: <Users className="w-4 h-4" />, href: "/dashboard/team" }
    );
  }

  if (user?.role === "ADMIN") {
    allCommands.push(
      { id: "admin-users", label: "Manage Users", description: "User management", icon: <Users className="w-4 h-4" />, href: "/dashboard/admin/users" },
      { id: "admin-settings", label: "Settings", description: "Admin settings", icon: <Settings className="w-4 h-4" />, href: "/dashboard/admin/settings" }
    );
  }

  useEffect(() => {
    if (commandPaletteOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [commandPaletteOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
      }
      if (e.key === "Escape") setCommandPaletteOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [commandPaletteOpen, setCommandPaletteOpen]);

  const filtered = allCommands.filter(
    (cmd) =>
      cmd.label.toLowerCase().includes((query || "").toLowerCase()) ||
      cmd.description?.toLowerCase().includes((query || "").toLowerCase())
  );

  const navigate = (href: string) => {
    router.push(href);
    setCommandPaletteOpen(false);
  };

  return (
    <AnimatePresence>
      {commandPaletteOpen && (
        <>
          <motion.div
            className="command-backdrop"
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(4px)" }}
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
            onClick={() => setCommandPaletteOpen(false)}
            style={{ backgroundColor: "rgba(0, 0, 0, 0.4)" }}
          />
          <motion.div
            className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-xl z-50 px-4"
            initial={{ opacity: 0, scale: 0.96, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -20 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="bg-white/80 backdrop-blur-2xl border border-white/60 rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.12)] overflow-hidden ring-1 ring-black/5">
              {/* Search Input */}
              <div className="flex items-center gap-3 px-4 py-4 border-b border-black/10 bg-white/50">
                <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search commands..."
                  className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground/70 text-base outline-none font-medium"
                  onChange={(e) => setQuery(e.target.value)}
                />
                <button
                  onClick={() => setCommandPaletteOpen(false)}
                  className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-md hover:bg-black/5"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {/* Commands */}
              <div className="py-2 max-h-[360px] overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-black/10 [&::-webkit-scrollbar-thumb]:rounded-full">
                {filtered.length === 0 ? (
                  <div className="px-4 py-12 text-center text-muted-foreground text-sm font-medium">
                    No commands found matching "{query}"
                  </div>
                ) : (
                  filtered.map((cmd) => (
                    <button
                      key={cmd.id}
                      onClick={() => navigate(cmd.href)}
                      className="w-full flex items-center gap-4 px-4 py-3 hover:bg-black/5 transition-all text-left group border-l-2 border-transparent hover:border-primary"
                    >
                      <div className="w-10 h-10 rounded-xl bg-white/60 shadow-sm border border-black/5 flex items-center justify-center text-muted-foreground group-hover:text-primary group-hover:scale-110 transition-all duration-300 group-hover:shadow-md">
                        {cmd.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-foreground/90 group-hover:text-foreground transition-colors">{cmd.label}</div>
                        {cmd.description && (
                          <div className="text-xs text-muted-foreground/80 mt-0.5">{cmd.description}</div>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
              {/* Footer */}
              <div className="px-5 py-3 border-t border-black/10 bg-black/[0.03] flex items-center gap-4 text-[11px] font-medium text-muted-foreground/70 uppercase tracking-wider">
                <span className="flex items-center gap-1.5"><kbd className="bg-white/80 px-1.5 py-0.5 rounded border border-black/10 shadow-sm font-sans">↑↓</kbd> navigate</span>
                <span className="flex items-center gap-1.5"><kbd className="bg-white/80 px-1.5 py-0.5 rounded border border-black/10 shadow-sm font-sans">↵</kbd> select</span>
                <span className="flex items-center gap-1.5"><kbd className="bg-white/80 px-1.5 py-0.5 rounded border border-black/10 shadow-sm font-sans">ESC</kbd> close</span>
                <span className="ml-auto flex items-center gap-1.5 text-foreground/50"><kbd className="bg-white/80 px-1.5 py-0.5 rounded border border-black/10 shadow-sm font-sans">⌘K</kbd></span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
