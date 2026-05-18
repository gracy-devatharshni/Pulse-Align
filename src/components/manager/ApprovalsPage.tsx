"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle, XCircle, RotateCcw, User, Target,
  ChevronDown, MessageSquare, Edit2, Clock, History
} from "lucide-react";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/cn";
import { getStatusColor } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface ApprovalsPageProps {
  pending: any[];
  history: any[];
  managerName: string;
}

export function ApprovalsPage({ pending, history, managerName }: ApprovalsPageProps) {
  const [activeTab, setActiveTab] = useState<"pending" | "history">("pending");
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground tracking-tight">
            Approvals
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {pending.length} pending review · Review, edit, and approve employee goals
          </p>
        </div>
        <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
          {(["pending", "history"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-4 py-1.5 rounded-md text-sm font-medium transition-colors capitalize",
                activeTab === tab
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab === "pending" ? `Pending (${pending.length})` : "History"}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "pending" ? (
          <motion.div
            key="pending"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-4"
          >
            {pending.length === 0 ? (
              <div className="text-center py-20 card-elevated">
                <CheckCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-display font-semibold text-foreground text-lg">All clear!</h3>
                <p className="text-muted-foreground text-sm mt-1">No pending approvals at this time.</p>
              </div>
            ) : (
              pending.map((group: any, i: number) => (
                <ApprovalGroup key={`${group.user.id}-${group.cycle.id}`} group={group} index={i} onRefresh={() => router.refresh()} />
              ))
            )}
          </motion.div>
        ) : (
          <motion.div
            key="history"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-2"
          >
            {history.length === 0 ? (
              <div className="text-center py-20 card-elevated">
                <History className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-display font-semibold text-foreground text-lg">No history yet</h3>
              </div>
            ) : (
              history.map((goal: any) => (
                <div key={goal.id} className="card-elevated p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">{goal.user.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{goal.title}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={cn("status-badge", getStatusColor(goal.status))}>
                      {goal.status}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(goal.updatedAt), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ApprovalGroup({ group, index, onRefresh }: { group: any; index: number; onRefresh: () => void }) {
  const [expanded, setExpanded] = useState(true);
  const [comment, setComment] = useState("");
  const [editedGoals, setEditedGoals] = useState<Record<string, { target?: number; weightage?: number }>>({});
  const [processing, setProcessing] = useState<string | null>(null);

  const handleApproval = async (action: "APPROVED" | "REJECTED" | "REWORK") => {
    if (!group.goals[0]) return;
    setProcessing(action);

    try {
      const res = await fetch(`/api/goals/${group.goals[0].id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: action,
          managerComment: comment || undefined,
          goals: Object.entries(editedGoals).map(([id, vals]) => ({ id, ...vals })),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }

      const labels = { APPROVED: "approved", REJECTED: "rejected", REWORK: "returned for rework" };
      toast.success(`Goals ${labels[action]} successfully!`);
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || "Action failed");
    } finally {
      setProcessing(null);
    }
  };

  const updateGoalEdit = (goalId: string, field: "target" | "weightage", value: number) => {
    setEditedGoals((prev) => ({
      ...prev,
      [goalId]: { ...prev[goalId], [field]: value },
    }));
  };

  const totalWeightage = group.goals.reduce((sum: number, g: any) => {
    return sum + (editedGoals[g.id]?.weightage ?? g.weightage);
  }, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="approval-card"
    >
      {/* Employee Header */}
      <div
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-secondary/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center font-display font-bold text-sm flex-shrink-0">
            {group.user.name.charAt(0)}
          </div>
          <div>
            <div className="font-display font-semibold text-foreground">{group.user.name}</div>
            <div className="text-sm text-muted-foreground">
              {group.user.email} · {group.user.department || "No dept."} · {group.cycle.name}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className={cn(
            "text-sm font-mono font-bold",
            Math.abs(totalWeightage - 100) < 0.01 ? "text-foreground" : "text-red-500"
          )}>
            {totalWeightage}%
          </div>
          <span className="status-badge bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
            <Clock className="w-3 h-3" /> {group.goals.length} goals
          </span>
          <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", expanded && "rotate-180")} />
        </div>
      </div>

      {/* Goals Detail */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="border-t border-border">
              {/* Goals Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-secondary/30">
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Goal</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">UoM</th>
                      <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Target</th>
                      <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Weight</th>
                      <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Deadline</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.goals.map((goal: any, i: number) => (
                      <tr key={goal.id} className={cn("border-b border-border table-row-hover", i % 2 === 0 ? "" : "bg-secondary/10")}>
                        <td className="px-4 py-3">
                          <div className="font-medium text-foreground">{goal.title}</div>
                          <div className="text-xs text-muted-foreground">{goal.thrustArea}</div>
                          {goal.description && (
                            <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{goal.description}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{goal.uom.replace("_", " ")}</td>
                        <td className="px-4 py-3 text-right">
                          {/* Inline edit target */}
                          <input
                            type="number"
                            defaultValue={goal.target}
                            onChange={(e) => updateGoalEdit(goal.id, "target", parseFloat(e.target.value))}
                            className="w-20 text-right bg-transparent border-b border-transparent hover:border-border focus:border-foreground outline-none font-mono transition-colors"
                          />
                        </td>
                        <td className="px-4 py-3 text-right">
                          {/* Inline edit weightage */}
                          <input
                            type="number"
                            defaultValue={goal.weightage}
                            min="10"
                            max="100"
                            step="5"
                            onChange={(e) => updateGoalEdit(goal.id, "weightage", parseFloat(e.target.value))}
                            className="w-16 text-right bg-transparent border-b border-transparent hover:border-border focus:border-foreground outline-none font-mono transition-colors"
                          />
                          <span className="text-muted-foreground font-mono">%</span>
                        </td>
                        <td className="px-4 py-3 text-right text-muted-foreground">
                          {format(new Date(goal.deadline), "dd MMM yyyy")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Comment & Actions */}
              <div className="p-4 space-y-3">
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <textarea
                    placeholder="Add a comment for the employee (optional)..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={2}
                    className="input-premium pl-9 resize-none"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleApproval("APPROVED")}
                    disabled={!!processing || Math.abs(totalWeightage - 100) > 0.01}
                    className="flex items-center gap-2 bg-foreground text-background px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40"
                  >
                    <CheckCircle className="w-4 h-4" />
                    {processing === "APPROVED" ? "Approving..." : "Approve"}
                  </button>
                  <button
                    onClick={() => handleApproval("REWORK")}
                    disabled={!!processing}
                    className="flex items-center gap-2 border border-border text-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-accent transition-colors disabled:opacity-40"
                  >
                    <RotateCcw className="w-4 h-4" />
                    {processing === "REWORK" ? "Sending..." : "Return for Rework"}
                  </button>
                  <button
                    onClick={() => handleApproval("REJECTED")}
                    disabled={!!processing}
                    className="flex items-center gap-2 border border-red-200 text-red-600 dark:border-red-800 dark:text-red-400 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-40 ml-auto"
                  >
                    <XCircle className="w-4 h-4" />
                    {processing === "REJECTED" ? "Rejecting..." : "Reject"}
                  </button>
                </div>
                {Math.abs(totalWeightage - 100) > 0.01 && (
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    ⚠ Total weightage is {totalWeightage}%. Must equal 100% to approve.
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
