"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { format, formatDistanceToNow } from "date-fns";
import {
  Clock, User, Target, CheckCircle, XCircle,
  RotateCcw, Lock, Plus, Edit, Trash2, Shield, Search, Filter
} from "lucide-react";
import { cn } from "@/lib/cn";

const ACTION_ICONS: Record<string, React.ReactNode> = {
  GOAL_CREATED: <Plus className="w-3.5 h-3.5" />,
  GOAL_UPDATED: <Edit className="w-3.5 h-3.5" />,
  GOAL_DELETED: <Trash2 className="w-3.5 h-3.5" />,
  GOALS_SUBMITTED: <Target className="w-3.5 h-3.5" />,
  GOALS_APPROVED: <CheckCircle className="w-3.5 h-3.5" />,
  GOALS_REJECTED: <XCircle className="w-3.5 h-3.5" />,
  GOALS_REWORK: <RotateCcw className="w-3.5 h-3.5" />,
  CHECK_IN_UPDATED: <Clock className="w-3.5 h-3.5" />,
  USER_UPDATED: <User className="w-3.5 h-3.5" />,
  USER_DELETED: <Trash2 className="w-3.5 h-3.5" />,
  CYCLE_CREATED: <Plus className="w-3.5 h-3.5" />,
  GOAL_UNLOCKED: <Lock className="w-3.5 h-3.5" />,
};

const ACTION_COLORS: Record<string, string> = {
  GOAL_CREATED: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  GOAL_UPDATED: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  GOAL_DELETED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  GOALS_SUBMITTED: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  GOALS_APPROVED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  GOALS_REJECTED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  GOALS_REWORK: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  CHECK_IN_UPDATED: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  USER_UPDATED: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
};

export function AuditPageClient({ userRole }: { userRole: string }) {
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        ...(actionFilter ? { action: actionFilter } : {}),
      });
      const res = await fetch(`/api/audit?${params}`);
      const data = await res.json();
      setLogs(data.logs || []);
      setTotal(data.total || 0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, [page, actionFilter]);

  const filtered = search
    ? logs.filter(
        (l) =>
          l.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
          l.action?.toLowerCase().includes(search.toLowerCase()) ||
          l.goal?.title?.toLowerCase().includes(search.toLowerCase())
      )
    : logs;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground">Audit Trail</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {total} total events · Complete history of all actions
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            placeholder="Search by user or action..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-premium pl-9"
          />
        </div>
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="input-premium w-auto"
        >
          <option value="">All Actions</option>
          {Object.keys(ACTION_ICONS).map((a) => (
            <option key={a} value={a}>{a.replace(/_/g, " ")}</option>
          ))}
        </select>
      </div>

      {/* Timeline */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 skeleton rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 card-elevated">
          <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-display font-semibold text-foreground">No audit logs found</h3>
        </div>
      ) : (
        <div className="relative">
          <div className="space-y-0">
            {filtered.map((log, i) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.3) }}
                className="relative flex gap-4 pb-4"
              >
                {/* Timeline line */}
                {i < filtered.length - 1 && (
                  <div className="timeline-line" />
                )}

                {/* Icon */}
                <div className={cn(
                  "relative z-10 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border-2 border-background",
                  ACTION_COLORS[log.action] || "bg-gray-100 text-gray-700"
                )}>
                  {ACTION_ICONS[log.action] || <Clock className="w-3.5 h-3.5" />}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pt-1.5">
                  <div className="card-elevated p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-foreground text-sm">
                            {log.user?.name || "System"}
                          </span>
                          <span className={cn("status-badge text-xs", ACTION_COLORS[log.action] || "bg-gray-100 text-gray-700")}>
                            {log.action.replace(/_/g, " ")}
                          </span>
                          {log.goal && (
                            <span className="text-sm text-muted-foreground truncate">
                              · {log.goal.title}
                            </span>
                          )}
                        </div>

                        {/* Values */}
                        {(log.prevValue || log.newValue) && (
                          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {log.prevValue && (
                              <div className="p-2 bg-red-50 dark:bg-red-900/10 rounded-lg">
                                <div className="text-xs font-medium text-red-600 dark:text-red-400 mb-1">Before</div>
                                <pre className="text-xs text-red-700 dark:text-red-300 font-mono overflow-x-auto">
                                  {JSON.stringify(log.prevValue, null, 2)}
                                </pre>
                              </div>
                            )}
                            {log.newValue && (
                              <div className="p-2 bg-green-50 dark:bg-green-900/10 rounded-lg">
                                <div className="text-xs font-medium text-green-600 dark:text-green-400 mb-1">After</div>
                                <pre className="text-xs text-green-700 dark:text-green-300 font-mono overflow-x-auto">
                                  {JSON.stringify(log.newValue, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="text-right flex-shrink-0">
                        <div className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                        </div>
                        <div className="text-xs text-muted-foreground font-mono mt-0.5">
                          {format(new Date(log.createdAt), "dd MMM HH:mm")}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Pagination */}
      {total > 20 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Showing {Math.min((page - 1) * 20 + 1, total)}–{Math.min(page * 20, total)} of {total}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-accent disabled:opacity-40 transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page * 20 >= total}
              className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-accent disabled:opacity-40 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
