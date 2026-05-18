"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle, Clock, AlertCircle, Target, Lock } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/cn";
import { getStatusColor, calculateProgressScore, getQuarterLabel, isCheckInWindowOpen } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface CheckInsPageProps {
  goals: any[];
  userId: string;
}

const QUARTERS = ["Q1", "Q2", "Q3", "Q4"] as const;

const STATUS_OPTIONS = [
  { value: "NOT_STARTED", label: "Not Started", icon: <AlertCircle className="w-4 h-4" /> },
  { value: "ON_TRACK", label: "On Track", icon: <Clock className="w-4 h-4" /> },
  { value: "COMPLETED", label: "Completed", icon: <CheckCircle className="w-4 h-4" /> },
];

export function CheckInsPage({ goals, userId }: CheckInsPageProps) {
  const router = useRouter();
  const [activeGoal, setActiveGoal] = useState<string>(goals[0]?.id || "");
  const [activeQuarter, setActiveQuarter] = useState<string>("Q1");
  const [formData, setFormData] = useState<Record<string, Record<string, any>>>({});
  const [saving, setSaving] = useState(false);

  const selectedGoal = goals.find((g) => g.id === activeGoal);

  const getCheckIn = (goalId: string, quarter: string) => {
    const goal = goals.find((g) => g.id === goalId);
    return goal?.checkIns?.find((ci: any) => ci.quarter === quarter);
  };

  const getFormValue = (goalId: string, quarter: string, field: string) => {
    const ci = getCheckIn(goalId, quarter);
    return formData[`${goalId}-${quarter}`]?.[field] ?? ci?.[field] ?? (field === "status" ? "NOT_STARTED" : "");
  };

  const updateFormValue = (goalId: string, quarter: string, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [`${goalId}-${quarter}`]: {
        ...prev[`${goalId}-${quarter}`],
        [field]: value,
      },
    }));
  };

  const handleSave = async (goalId: string, quarter: string) => {
    setSaving(true);
    try {
      const values = formData[`${goalId}-${quarter}`] || {};
      const ci = getCheckIn(goalId, quarter);

      const payload = {
        goalId,
        quarter,
        achievement: values.achievement !== undefined ? parseFloat(values.achievement) : ci?.achievement,
        completionDate: values.completionDate || ci?.completionDate?.split("T")[0] || undefined,
        status: values.status || ci?.status || "NOT_STARTED",
      };

      const res = await fetch("/api/check-ins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }

      toast.success(`${quarter} check-in saved!`);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to save check-in");
    } finally {
      setSaving(false);
    }
  };

  if (goals.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Check-ins</h1>
          <p className="text-muted-foreground mt-1 text-sm">Quarterly progress updates</p>
        </div>
        <div className="text-center py-20 card-elevated">
          <Lock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-display font-semibold text-foreground text-lg">No approved goals</h3>
          <p className="text-muted-foreground text-sm mt-1">
            Your goals need to be approved by your manager before you can add check-ins.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground">Check-ins</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Update your quarterly achievements · {goals.length} active goals
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Goal selector */}
        <div className="space-y-2">
          <h2 className="font-display font-semibold text-sm text-muted-foreground uppercase tracking-wider">Goals</h2>
          {goals.map((goal) => (
            <button
              key={goal.id}
              onClick={() => setActiveGoal(goal.id)}
              className={cn(
                "w-full text-left p-3 rounded-xl border transition-all",
                activeGoal === goal.id
                  ? "border-foreground bg-foreground text-background"
                  : "border-border hover:border-foreground/40 text-foreground"
              )}
            >
              <div className="font-medium text-sm line-clamp-2">{goal.title}</div>
              <div className="text-xs mt-1 opacity-70">{goal.thrustArea}</div>
              <div className="flex items-center gap-1 mt-1.5">
                {QUARTERS.map((q) => {
                  const ci = getCheckIn(goal.id, q);
                  return (
                    <div
                      key={q}
                      className={cn(
                        "w-5 h-5 rounded text-center text-xs flex items-center justify-center font-mono",
                        ci?.status === "COMPLETED" ? "bg-green-500 text-white" :
                        ci?.status === "ON_TRACK" ? "bg-blue-500 text-white" :
                        ci ? "bg-yellow-500 text-white" :
                        activeGoal === goal.id ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                      )}
                    >
                      {q.charAt(1)}
                    </div>
                  );
                })}
              </div>
            </button>
          ))}
        </div>

        {/* Check-in Form */}
        <div className="lg:col-span-3">
          {selectedGoal && (
            <motion.div
              key={selectedGoal.id}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="card-elevated overflow-hidden"
            >
              {/* Goal Header */}
              <div className="p-5 border-b border-border bg-secondary/20">
                <h2 className="font-display font-bold text-foreground text-xl">{selectedGoal.title}</h2>
                <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                  <span>{selectedGoal.thrustArea}</span>
                  <span>·</span>
                  <span>Target: <span className="font-mono text-foreground">{selectedGoal.target}</span></span>
                  <span>·</span>
                  <span>{selectedGoal.uom.replace("_", " ")}</span>
                  <span>·</span>
                  <span>{selectedGoal.weightage}% weight</span>
                </div>
              </div>

              {/* Quarter Tabs */}
              <div className="flex border-b border-border">
                {QUARTERS.map((q) => {
                  const windowOpen = isCheckInWindowOpen(q);
                  const ci = getCheckIn(selectedGoal.id, q);
                  return (
                    <button
                      key={q}
                      onClick={() => setActiveQuarter(q)}
                      className={cn(
                        "flex-1 px-4 py-3 text-sm font-medium transition-colors border-b-2",
                        activeQuarter === q
                          ? "border-foreground text-foreground"
                          : "border-transparent text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <div>{getQuarterLabel(q)}</div>
                      {ci && (
                        <div className={cn("text-xs mt-0.5", getStatusColor(ci.status).split(" ")[0])}>
                          {ci.status.replace("_", " ")}
                        </div>
                      )}
                      {windowOpen && (
                        <div className="text-xs text-green-500 mt-0.5">Active</div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Form */}
              <div className="p-6">
                {(() => {
                  const ci = getCheckIn(selectedGoal.id, activeQuarter);
                  const windowOpen = isCheckInWindowOpen(activeQuarter);

                  if (!windowOpen && !ci) {
                    return (
                      <div className="text-center py-12">
                        <Lock className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                        <p className="text-muted-foreground">Check-in window for {getQuarterLabel(activeQuarter)} is not open yet.</p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-5">
                      {/* Status */}
                      <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">Status</label>
                        <div className="grid grid-cols-3 gap-3">
                          {STATUS_OPTIONS.map((opt) => (
                            <label
                              key={opt.value}
                              className={cn(
                                "flex flex-col items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all",
                                (!windowOpen) && "opacity-50 pointer-events-none",
                                getFormValue(selectedGoal.id, activeQuarter, "status") === opt.value
                                  ? "border-foreground bg-foreground/5"
                                  : "border-border hover:border-foreground/40"
                              )}
                            >
                              <input
                                type="radio"
                                name={`status-${activeQuarter}`}
                                value={opt.value}
                                checked={getFormValue(selectedGoal.id, activeQuarter, "status") === opt.value}
                                onChange={(e) => updateFormValue(selectedGoal.id, activeQuarter, "status", e.target.value)}
                                disabled={!windowOpen}
                                className="sr-only"
                              />
                              {opt.icon}
                              <span className="text-sm font-medium text-foreground">{opt.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Achievement */}
                      {selectedGoal.uom !== "TIMELINE" && selectedGoal.uom !== "ZERO_BASED" && (
                        <div>
                          <label className="text-sm font-medium text-foreground mb-1.5 block">
                            Actual Achievement
                            <span className="text-muted-foreground font-normal ml-1">
                              (Target: {selectedGoal.target})
                            </span>
                          </label>
                          <input
                            type="number"
                            step="any"
                            value={getFormValue(selectedGoal.id, activeQuarter, "achievement")}
                            onChange={(e) => updateFormValue(selectedGoal.id, activeQuarter, "achievement", e.target.value)}
                            disabled={!windowOpen}
                            placeholder="Enter actual achievement"
                            className="input-premium font-mono"
                          />
                        </div>
                      )}

                      {/* Timeline completion date */}
                      {selectedGoal.uom === "TIMELINE" && (
                        <div>
                          <label className="text-sm font-medium text-foreground mb-1.5 block">
                            Completion Date
                            <span className="text-muted-foreground font-normal ml-1">
                              (Deadline: {format(new Date(selectedGoal.deadline), "dd MMM yyyy")})
                            </span>
                          </label>
                          <input
                            type="date"
                            value={getFormValue(selectedGoal.id, activeQuarter, "completionDate")}
                            onChange={(e) => updateFormValue(selectedGoal.id, activeQuarter, "completionDate", e.target.value)}
                            disabled={!windowOpen}
                            className="input-premium"
                          />
                        </div>
                      )}

                      {/* Progress Preview */}
                      {(() => {
                        const ach = parseFloat(getFormValue(selectedGoal.id, activeQuarter, "achievement") || ci?.achievement || 0);
                        const score = calculateProgressScore(selectedGoal.uom, selectedGoal.target, ach, selectedGoal.isLowerBetter);
                        return (
                          <div className="p-4 bg-secondary rounded-xl">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm text-muted-foreground">Progress Score</span>
                              <span className="font-mono font-bold text-foreground text-lg">{Math.round(score)}%</span>
                            </div>
                            <div className="weightage-bar">
                              <motion.div
                                className="weightage-bar-fill"
                                animate={{ width: `${Math.min(score, 100)}%` }}
                                transition={{ duration: 0.5 }}
                              />
                            </div>
                          </div>
                        );
                      })()}

                      {/* Manager comment if any */}
                      {ci?.managerComment && (
                        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                          <div className="text-xs font-semibold text-amber-700 dark:text-amber-300 mb-1">Manager Comment</div>
                          <p className="text-sm text-amber-600 dark:text-amber-400">{ci.managerComment}</p>
                        </div>
                      )}

                      {windowOpen && (
                        <button
                          onClick={() => handleSave(selectedGoal.id, activeQuarter)}
                          disabled={saving}
                          className="w-full py-2.5 bg-foreground text-background rounded-lg font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                          {saving ? "Saving..." : `Save ${activeQuarter} Check-in`}
                        </button>
                      )}
                    </div>
                  );
                })()}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
