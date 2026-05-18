"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Minus, Info } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { goalSchema } from "@/lib/validations";
import { cn } from "@/lib/cn";

interface GoalFormModalProps {
  open: boolean;
  onClose: () => void;
  editGoal?: any;
  cycles: any[];
  defaultCycleId?: string;
  onSuccess: () => void;
}

type GoalFormData = z.infer<typeof goalSchema>;

const UOM_OPTIONS = [
  { value: "NUMERIC", label: "Numeric", desc: "Raw number (e.g., sales count)" },
  { value: "PERCENTAGE", label: "Percentage", desc: "% achievement" },
  { value: "TIMELINE", label: "Timeline", desc: "Date-based completion" },
  { value: "ZERO_BASED", label: "Zero-based", desc: "0 = success, non-zero = failure" },
];

const THRUST_AREAS = [
  "Revenue Growth", "Customer Experience", "Operational Excellence",
  "Innovation", "People Development", "Digital Transformation",
  "Cost Optimization", "Quality Assurance", "Market Expansion",
];

export function GoalFormModal({
  open, onClose, editGoal, cycles, defaultCycleId, onSuccess,
}: GoalFormModalProps) {
  const [loading, setLoading] = useState(false);
  const isEdit = !!editGoal;

  const {
    register,
    handleSubmit,
    watch,
    reset,
    control,
    formState: { errors },
  } = useForm<GoalFormData>({
    resolver: zodResolver(goalSchema),
    defaultValues: editGoal
      ? {
          thrustArea: editGoal.thrustArea,
          title: editGoal.title,
          description: editGoal.description || "",
          uom: editGoal.uom,
          target: editGoal.target,
          weightage: editGoal.weightage,
          deadline: editGoal.deadline.split("T")[0],
          isLowerBetter: editGoal.isLowerBetter,
          cycleId: editGoal.cycleId,
        }
      : {
          thrustArea: "",
          title: "",
          description: "",
          uom: "NUMERIC",
          target: 0,
          weightage: 10,
          deadline: "",
          isLowerBetter: false,
          cycleId: defaultCycleId || "",
        },
  });

  useEffect(() => {
    if (open && !editGoal) {
      reset({
        thrustArea: "",
        title: "",
        description: "",
        uom: "NUMERIC",
        target: 0,
        weightage: 10,
        deadline: "",
        isLowerBetter: false,
        cycleId: defaultCycleId || "",
      });
    }
  }, [open, editGoal, defaultCycleId, reset]);

  const watchedUom = watch("uom");
  const watchedWeightage = watch("weightage");

  const onSubmit = async (data: GoalFormData) => {
    setLoading(true);
    try {
      const url = isEdit ? `/api/goals/${editGoal.id}` : "/api/goals";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(
          Array.isArray(err.error)
            ? err.error.map((e: any) => e.message).join(", ")
            : err.error
        );
      }

      toast.success(isEdit ? "Goal updated!" : "Goal created!");
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          className="relative bg-card border border-border rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto"
          initial={{ opacity: 0, y: 50, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.97 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-card border-b border-border px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="font-display font-bold text-foreground text-lg">
                {isEdit ? "Edit Goal" : "New Goal"}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Min 10% weightage · Max 8 goals per cycle
              </p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
            {/* Cycle */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Performance Cycle <span className="text-red-500">*</span>
              </label>
              <select {...register("cycleId")} className="input-premium">
                <option value="">Select cycle...</option>
                {cycles.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.isActive ? "(Active)" : ""}
                  </option>
                ))}
              </select>
              {errors.cycleId && <p className="text-red-500 text-xs mt-1">{errors.cycleId.message}</p>}
            </div>

            {/* Thrust Area */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Thrust Area <span className="text-red-500">*</span>
              </label>
              <input
                {...register("thrustArea")}
                list="thrust-areas"
                placeholder="e.g., Revenue Growth"
                className="input-premium"
              />
              <datalist id="thrust-areas">
                {THRUST_AREAS.map((t) => <option key={t} value={t} />)}
              </datalist>
              {errors.thrustArea && <p className="text-red-500 text-xs mt-1">{errors.thrustArea.message}</p>}
            </div>

            {/* Title */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Goal Title <span className="text-red-500">*</span>
              </label>
              <input
                {...register("title")}
                placeholder="What is the goal you want to achieve?"
                className="input-premium"
              />
              {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
            </div>

            {/* Description */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Description
              </label>
              <textarea
                {...register("description")}
                placeholder="Provide more context about this goal..."
                rows={2}
                className="input-premium resize-none"
              />
            </div>

            {/* UoM */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Unit of Measurement <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {UOM_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className={cn(
                      "flex flex-col p-3 rounded-lg border cursor-pointer transition-all",
                      watchedUom === opt.value
                        ? "border-foreground bg-foreground/5"
                        : "border-border hover:border-foreground/40"
                    )}
                  >
                    <input
                      {...register("uom")}
                      type="radio"
                      value={opt.value}
                      className="sr-only"
                    />
                    <span className="text-sm font-medium text-foreground">{opt.label}</span>
                    <span className="text-xs text-muted-foreground mt-0.5">{opt.desc}</span>
                  </label>
                ))}
              </div>
              {errors.uom && <p className="text-red-500 text-xs mt-1">{errors.uom.message}</p>}
            </div>

            {/* Target & Weightage */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">
                  Target <span className="text-red-500">*</span>
                </label>
                <input
                  {...register("target", { valueAsNumber: true })}
                  type="number"
                  step="any"
                  min="0"
                  placeholder="100"
                  className="input-premium font-mono"
                />
                {errors.target && <p className="text-red-500 text-xs mt-1">{errors.target.message}</p>}
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">
                  Weightage (%) <span className="text-red-500">*</span>
                </label>
                <input
                  {...register("weightage", { valueAsNumber: true })}
                  type="number"
                  min="10"
                  max="100"
                  step="5"
                  className="input-premium font-mono"
                />
                {errors.weightage && <p className="text-red-500 text-xs mt-1">{errors.weightage.message}</p>}
              </div>
            </div>

            {/* Deadline */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Deadline <span className="text-red-500">*</span>
              </label>
              <input
                {...register("deadline")}
                type="date"
                className="input-premium"
              />
              {errors.deadline && <p className="text-red-500 text-xs mt-1">{errors.deadline.message}</p>}
            </div>

            {/* Lower is better */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary">
              <input
                {...register("isLowerBetter")}
                type="checkbox"
                id="isLowerBetter"
                className="w-4 h-4 rounded"
              />
              <label htmlFor="isLowerBetter" className="text-sm text-foreground cursor-pointer">
                Lower value = better performance
                <span className="text-xs text-muted-foreground ml-1">(e.g., defect rate, error count)</span>
              </label>
            </div>

            {/* Submit */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-accent transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 rounded-lg bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading ? "Saving..." : isEdit ? "Update Goal" : "Create Goal"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
