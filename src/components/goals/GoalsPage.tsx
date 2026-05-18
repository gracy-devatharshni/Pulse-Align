"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Target, Filter, Search, CheckCircle,
  Clock, AlertCircle, Lock, Send, Edit, Trash2,
  ChevronDown, MoreHorizontal, ArrowUpDown
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { getStatusColor, calculateProgressScore } from "@/lib/utils";
import { GoalFormModal } from "./GoalFormModal";
import { useRouter } from "next/navigation";

const STATUS_ICONS: Record<string, React.ReactNode> = {
  DRAFT: <Edit className="w-3 h-3" />,
  SUBMITTED: <Clock className="w-3 h-3" />,
  APPROVED: <CheckCircle className="w-3 h-3" />,
  REJECTED: <AlertCircle className="w-3 h-3" />,
  REWORK: <AlertCircle className="w-3 h-3" />,
  LOCKED: <Lock className="w-3 h-3" />,
};

interface GoalsPageProps {
  data: {
    goals: any[];
    cycles: any[];
    user: any;
  };
}

export function GoalsPage({ data }: GoalsPageProps) {
  const { goals, cycles, user } = data;
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [selectedCycle, setSelectedCycle] = useState<string>(
    cycles.find((c: any) => c.isActive)?.id || "ALL"
  );
  const [showForm, setShowForm] = useState(false);
  const [editGoal, setEditGoal] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  const activeCycle = cycles.find((c: any) => c.id === selectedCycle);

  const filtered = goals.filter((g) => {
    const matchCycle = selectedCycle === "ALL" || g.cycleId === selectedCycle;
    const matchStatus = filterStatus === "ALL" || g.status === filterStatus;
    const matchSearch =
      g.title.toLowerCase().includes(search.toLowerCase()) ||
      g.thrustArea.toLowerCase().includes(search.toLowerCase());
    return matchCycle && matchStatus && matchSearch;
  });

  const cycleGoals = goals.filter(
    (g) => selectedCycle !== "ALL" && g.cycleId === selectedCycle
  );
  const totalWeightage = cycleGoals.reduce((sum, g) => sum + g.weightage, 0);
  const canSubmit =
    Math.abs(totalWeightage - 100) < 0.01 &&
    cycleGoals.every((g) => ["DRAFT", "REWORK"].includes(g.status)) &&
    cycleGoals.length > 0;

  const handleSubmitAll = async () => {
    if (!canSubmit || !cycleGoals[0]) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/goals/${cycleGoals[0].id}/submit`, {
        method: "POST",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      toast.success("Goals submitted for manager approval!");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit goals");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (goalId: string) => {
    try {
      const res = await fetch(`/api/goals/${goalId}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      toast.success("Goal deleted");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete goal");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground tracking-tight">
            My Goals
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {cycleGoals.length} goals · {totalWeightage}% total weightage
            {activeCycle && ` · ${activeCycle.name}`}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {canSubmit && (
            <button
              onClick={handleSubmitAll}
              disabled={submitting}
              className="flex items-center gap-2 bg-foreground text-background px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {submitting ? "Submitting..." : "Submit for Approval"}
            </button>
          )}
          {cycleGoals.length < 8 && (
            <button
              onClick={() => { setEditGoal(null); setShowForm(true); }}
              className="flex items-center gap-2 border border-border text-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-accent transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Goal
            </button>
          )}
        </div>
      </div>

      {/* Weightage Progress */}
      <div className="card-elevated p-4">
        <div className="flex items-center justify-between mb-2 text-sm">
          <span className="text-muted-foreground font-medium">Weightage Distribution</span>
          <div className="flex items-center gap-2">
            <span className={cn(
              "font-mono font-bold text-base",
              Math.abs(totalWeightage - 100) < 0.01 ? "text-foreground" : totalWeightage > 100 ? "text-red-500" : "text-amber-500"
            )}>
              {totalWeightage}%
            </span>
            <span className="text-muted-foreground">/ 100%</span>
            {Math.abs(totalWeightage - 100) < 0.01 && (
              <CheckCircle className="w-4 h-4 text-green-500" />
            )}
          </div>
        </div>
        <div className="weightage-bar">
          <motion.div
            className={cn(
              "weightage-bar-fill",
              totalWeightage > 100 ? "bg-red-500" : undefined
            )}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(totalWeightage, 100)}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
        <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
          <span>Min 10% per goal</span>
          <span>·</span>
          <span>Max 8 goals</span>
          <span>·</span>
          <span className={cycleGoals.length >= 8 ? "text-amber-500 font-medium" : ""}>
            {cycleGoals.length}/8 goals
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search goals..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-premium pl-9"
          />
        </div>
        <select
          value={selectedCycle}
          onChange={(e) => setSelectedCycle(e.target.value)}
          className="input-premium w-auto"
        >
          <option value="ALL">All Cycles</option>
          {cycles.map((c: any) => (
            <option key={c.id} value={c.id}>
              {c.name} {c.isActive ? "(Active)" : ""}
            </option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="input-premium w-auto"
        >
          <option value="ALL">All Status</option>
          {["DRAFT", "SUBMITTED", "APPROVED", "REJECTED", "REWORK", "LOCKED"].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Goals Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 card-elevated">
          <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-display font-semibold text-foreground text-lg">No goals found</h3>
          <p className="text-muted-foreground text-sm mt-1 mb-4">
            {goals.length === 0 ? "Start by setting your first goal" : "Try adjusting filters"}
          </p>
          {goals.length === 0 && (
            <button
              onClick={() => setShowForm(true)}
              className="bg-foreground text-background px-4 py-2 rounded-lg text-sm font-medium inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Set First Goal
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          <AnimatePresence>
            {filtered.map((goal, i) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                index={i}
                onEdit={() => { setEditGoal(goal); setShowForm(true); }}
                onDelete={() => handleDelete(goal.id)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Goal Form Modal */}
      <GoalFormModal
        open={showForm}
        onClose={() => { setShowForm(false); setEditGoal(null); }}
        editGoal={editGoal}
        cycles={cycles}
        defaultCycleId={selectedCycle !== "ALL" ? selectedCycle : cycles.find((c: any) => c.isActive)?.id}
        onSuccess={() => { setShowForm(false); setEditGoal(null); router.refresh(); }}
      />
    </div>
  );
}

function GoalCard({
  goal, index, onEdit, onDelete,
}: {
  goal: any;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const canEdit = ["DRAFT", "REWORK"].includes(goal.status);
  const canDelete = ["DRAFT", "REWORK"].includes(goal.status);

  const latestCheckIn = goal.checkIns?.[0];
  const progress = latestCheckIn
    ? calculateProgressScore(goal.uom, goal.target, latestCheckIn.achievement, goal.isLowerBetter)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ delay: index * 0.05 }}
      className="approval-card"
    >
      <div
        className="p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                {goal.thrustArea}
              </span>
              <span className={cn("status-badge", getStatusColor(goal.status))}>
                {STATUS_ICONS[goal.status]}
                {goal.status}
              </span>
              {goal.isShared && (
                <span className="status-badge bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                  Shared
                </span>
              )}
            </div>
            <h3 className="font-display font-semibold text-foreground text-base leading-tight">
              {goal.title}
            </h3>
            {goal.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{goal.description}</p>
            )}
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="text-right">
              <div className="font-mono font-bold text-foreground text-lg">{goal.weightage}%</div>
              <div className="text-xs text-muted-foreground">weight</div>
            </div>
            <div className="text-right">
              <div className="font-mono font-bold text-foreground">{Math.round(progress)}%</div>
              <div className="text-xs text-muted-foreground">progress</div>
            </div>
            <ChevronDown
              className={cn(
                "w-4 h-4 text-muted-foreground transition-transform",
                expanded && "rotate-180"
              )}
            />
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3 weightage-bar">
          <motion.div
            className="weightage-bar-fill"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(progress, 100)}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Expanded Details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-border"
          >
            <div className="p-4 bg-secondary/30">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                <DetailItem label="UoM" value={goal.uom.replace("_", " ")} />
                <DetailItem label="Target" value={goal.target.toString()} mono />
                <DetailItem label="Deadline" value={format(new Date(goal.deadline), "dd MMM yyyy")} />
                <DetailItem label="Cycle" value={goal.cycle.name} />
              </div>

              {goal.managerComment && (
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg mb-4 text-sm">
                  <div className="font-medium text-amber-700 dark:text-amber-300 mb-1">Manager Comment</div>
                  <div className="text-amber-600 dark:text-amber-400">{goal.managerComment}</div>
                </div>
              )}

              {/* Check-ins */}
              {goal.checkIns.length > 0 && (
                <div className="mb-4">
                  <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2">
                    Check-ins
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {["Q1", "Q2", "Q3", "Q4"].map((q) => {
                      const ci = goal.checkIns.find((c: any) => c.quarter === q);
                      return (
                        <div key={q} className={cn(
                          "p-2 rounded-lg text-center text-xs",
                          ci ? "bg-foreground text-background" : "bg-muted text-muted-foreground"
                        )}>
                          <div className="font-mono font-bold">{q}</div>
                          {ci && (
                            <>
                              <div className="font-medium mt-0.5">{ci.achievement ?? "—"}</div>
                              <div className="opacity-70">{ci.status}</div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2">
                {canEdit && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onEdit(); }}
                    className="flex items-center gap-1.5 text-sm text-foreground border border-border px-3 py-1.5 rounded-lg hover:bg-accent transition-colors"
                  >
                    <Edit className="w-3.5 h-3.5" /> Edit
                  </button>
                )}
                <Link
                  href={`/dashboard/check-ins?goalId=${goal.id}`}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground border border-border px-3 py-1.5 rounded-lg hover:bg-accent transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <CheckCircle className="w-3.5 h-3.5" /> Check-in
                </Link>
                {canDelete && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    className="flex items-center gap-1.5 text-sm text-red-600 border border-red-200 dark:border-red-900 px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors ml-auto"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function DetailItem({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground mb-0.5">{label}</div>
      <div className={cn("text-sm font-medium text-foreground", mono && "font-mono")}>{value}</div>
    </div>
  );
}
