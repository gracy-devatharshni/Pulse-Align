"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Share2, Plus, Users, Link2, X } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/cn";
import { useRouter } from "next/navigation";
import { getStatusColor } from "@/lib/utils";

interface SharedGoalsPageClientProps {
  userRole: string;
  userId: string;
  teamMembers: any[];
  cycles: any[];
}

export function SharedGoalsPageClient({ userRole, userId, teamMembers, cycles }: SharedGoalsPageClientProps) {
  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState({
    cycleId: cycles.find((c: any) => c.isActive)?.id || "",
    thrustArea: "",
    title: "",
    description: "",
    uom: "NUMERIC",
    target: "",
    weightage: "10",
    deadline: "",
    targetUserIds: [] as string[],
  });

  const fetchGoals = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/shared-goals");
      const data = await res.json();
      setGoals(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchGoals(); }, []);

  const toggleUser = (userId: string) => {
    setFormData((prev) => ({
      ...prev,
      targetUserIds: prev.targetUserIds.includes(userId)
        ? prev.targetUserIds.filter((id) => id !== userId)
        : [...prev.targetUserIds, userId],
    }));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.targetUserIds.length === 0) {
      toast.error("Select at least one team member");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/shared-goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, target: parseFloat(formData.target), weightage: parseFloat(formData.weightage) }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      toast.success(`Shared goal pushed to ${formData.targetUserIds.length} team member(s)!`);
      setShowForm(false);
      setFormData({ cycleId: cycles.find((c: any) => c.isActive)?.id || "", thrustArea: "", title: "", description: "", uom: "NUMERIC", target: "", weightage: "10", deadline: "", targetUserIds: [] });
      fetchGoals();
    } catch (err: any) {
      toast.error(err.message || "Failed to create shared goal");
    } finally {
      setCreating(false);
    }
  };

  const canCreate = userRole === "MANAGER" || userRole === "ADMIN";

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Shared Goals</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Departmental KPIs pushed to multiple employees
          </p>
        </div>
        {canCreate && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-foreground text-background px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90"
          >
            <Plus className="w-4 h-4" /> Push Shared Goal
          </button>
        )}
      </div>

      {/* Create Form */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-elevated p-6"
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display font-semibold text-foreground">Push Shared Goal</h2>
            <button onClick={() => setShowForm(false)}><X className="w-4 h-4 text-muted-foreground" /></button>
          </div>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Cycle *</label>
                <select value={formData.cycleId} onChange={(e) => setFormData((p) => ({ ...p, cycleId: e.target.value }))} className="input-premium">
                  {cycles.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Thrust Area *</label>
                <input value={formData.thrustArea} onChange={(e) => setFormData((p) => ({ ...p, thrustArea: e.target.value }))} placeholder="e.g., Revenue Growth" className="input-premium" required />
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-foreground mb-1.5 block">Goal Title *</label>
                <input value={formData.title} onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))} placeholder="What KPI are you sharing?" className="input-premium" required />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">UoM *</label>
                <select value={formData.uom} onChange={(e) => setFormData((p) => ({ ...p, uom: e.target.value }))} className="input-premium">
                  {["NUMERIC", "PERCENTAGE", "TIMELINE", "ZERO_BASED"].map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Target *</label>
                <input type="number" value={formData.target} onChange={(e) => setFormData((p) => ({ ...p, target: e.target.value }))} className="input-premium font-mono" required />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Default Weightage (%)</label>
                <input type="number" min="10" max="100" value={formData.weightage} onChange={(e) => setFormData((p) => ({ ...p, weightage: e.target.value }))} className="input-premium font-mono" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Deadline *</label>
                <input type="date" value={formData.deadline} onChange={(e) => setFormData((p) => ({ ...p, deadline: e.target.value }))} className="input-premium" required />
              </div>
            </div>

            {/* Team Member Selection */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Push to team members *
                <span className="text-muted-foreground font-normal ml-1">({formData.targetUserIds.length} selected)</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-1">
                {teamMembers.map((member: any) => (
                  <label
                    key={member.id}
                    className={cn(
                      "flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all text-sm",
                      formData.targetUserIds.includes(member.id)
                        ? "border-foreground bg-foreground/5"
                        : "border-border hover:border-foreground/40"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={formData.targetUserIds.includes(member.id)}
                      onChange={() => toggleUser(member.id)}
                      className="w-3.5 h-3.5"
                    />
                    <div className="min-w-0">
                      <div className="font-medium text-foreground truncate">{member.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{member.department || "No dept."}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 border border-border rounded-lg text-sm">Cancel</button>
              <button type="submit" disabled={creating} className="flex-1 py-2.5 bg-foreground text-background rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50">
                {creating ? "Pushing..." : `Push to ${formData.targetUserIds.length || 0} member(s)`}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Shared Goals List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-24 skeleton rounded-xl" />)}
        </div>
      ) : goals.length === 0 ? (
        <div className="text-center py-20 card-elevated">
          <Share2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-display font-semibold text-foreground">No shared goals yet</h3>
          <p className="text-muted-foreground text-sm mt-1">
            {canCreate ? "Push a departmental KPI to your team" : "Your manager hasn't shared any goals yet"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {goals.map((goal: any, i: number) => (
            <motion.div
              key={goal.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="card-elevated p-5"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Link2 className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{goal.thrustArea}</span>
                    <span className={cn("status-badge", getStatusColor(goal.status))}>{goal.status}</span>
                  </div>
                  <h3 className="font-display font-semibold text-foreground">{goal.title}</h3>
                  <div className="text-sm text-muted-foreground mt-1">
                    Target: <span className="font-mono text-foreground">{goal.target}</span>
                    <span className="mx-2">·</span>
                    {goal.uom} · Deadline: {format(new Date(goal.deadline), "dd MMM yyyy")}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-mono font-bold text-foreground">{goal.weightage}%</div>
                  <div className="text-xs text-muted-foreground">weight</div>
                </div>
              </div>

              {goal.childGoals?.length > 0 && (
                <div>
                  <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2">
                    Linked to {goal.childGoals.length} employee(s)
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {goal.childGoals.map((child: any) => (
                      <div key={child.id} className="flex items-center gap-1.5 px-2.5 py-1 bg-secondary rounded-full text-xs">
                        <div className="w-4 h-4 rounded-full bg-foreground text-background flex items-center justify-center font-bold text-xs">
                          {child.user.name.charAt(0)}
                        </div>
                        <span className="text-foreground">{child.user.name}</span>
                        <span className={cn("font-mono", getStatusColor(child.status).split(" ")[0])}>
                          {child.checkIns?.[0]?.achievement ?? "—"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
