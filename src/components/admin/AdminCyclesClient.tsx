"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, GitBranch, CheckCircle, X } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/cn";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { cycleSchema, CycleFormData } from "@/lib/validations";

export function AdminCyclesClient() {
  const [cycles, setCycles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CycleFormData>({
    resolver: zodResolver(cycleSchema),
    defaultValues: { year: new Date().getFullYear(), isActive: false },
  });

  const fetchCycles = async () => {
    setLoading(true);
    const res = await fetch("/api/cycles");
    const data = await res.json();
    setCycles(data);
    setLoading(false);
  };

  useEffect(() => { fetchCycles(); }, []);

  const onSubmit = async (data: CycleFormData) => {
    setCreating(true);
    try {
      const res = await fetch("/api/cycles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(Array.isArray(err.error) ? err.error[0]?.message : err.error);
      }
      toast.success("Cycle created!");
      reset();
      setShowForm(false);
      fetchCycles();
    } catch (err: any) {
      toast.error(err.message || "Failed to create cycle");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Performance Cycles</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {cycles.length} cycles · Manage annual performance periods
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-foreground text-background px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90"
        >
          <Plus className="w-4 h-4" /> New Cycle
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-elevated p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-foreground">Create New Cycle</h2>
            <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Cycle Name *</label>
              <input {...register("name")} placeholder="e.g., FY 2025-26" className="input-premium" />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Year *</label>
              <input {...register("year", { valueAsNumber: true })} type="number" className="input-premium font-mono" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Start Date *</label>
              <input {...register("startDate")} type="date" className="input-premium" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">End Date *</label>
              <input {...register("endDate")} type="date" className="input-premium" />
            </div>
            <div className="sm:col-span-2 flex items-center gap-3">
              <input {...register("isActive")} type="checkbox" id="isActive" className="w-4 h-4 rounded" />
              <label htmlFor="isActive" className="text-sm text-foreground">Set as active cycle (will deactivate others)</label>
            </div>
            <div className="sm:col-span-2 flex gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 border border-border rounded-lg text-sm">Cancel</button>
              <button type="submit" disabled={creating} className="flex-1 py-2.5 bg-foreground text-background rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50">
                {creating ? "Creating..." : "Create Cycle"}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Cycles List */}
      <div className="space-y-3">
        {loading ? (
          [...Array(3)].map((_, i) => <div key={i} className="h-24 skeleton rounded-xl" />)
        ) : cycles.length === 0 ? (
          <div className="text-center py-20 card-elevated">
            <GitBranch className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-display font-semibold text-foreground">No cycles yet</h3>
            <p className="text-muted-foreground text-sm mt-1 mb-4">Create your first performance cycle</p>
            <button onClick={() => setShowForm(true)} className="bg-foreground text-background px-4 py-2 rounded-lg text-sm font-medium">
              Create Cycle
            </button>
          </div>
        ) : (
          cycles.map((cycle, i) => (
            <motion.div
              key={cycle.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={cn("card-elevated p-5 flex items-center justify-between gap-4", cycle.isActive && "border-foreground")}
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                  cycle.isActive ? "bg-foreground text-background" : "bg-secondary text-muted-foreground"
                )}>
                  <GitBranch className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display font-semibold text-foreground">{cycle.name}</h3>
                    {cycle.isActive && (
                      <span className="status-badge bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                        <CheckCircle className="w-3 h-3" /> Active
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground mt-0.5">
                    {format(new Date(cycle.startDate), "dd MMM yyyy")} — {format(new Date(cycle.endDate), "dd MMM yyyy")}
                    <span className="mx-2">·</span>
                    <span className="font-mono">{cycle._count?.goals || 0} goals</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono font-bold text-foreground text-lg">{cycle.year}</div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
