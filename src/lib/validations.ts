import { z } from "zod";

export const goalSchema = z.object({
  thrustArea: z.string().min(1, "Thrust area is required"),
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  uom: z.enum(["NUMERIC", "PERCENTAGE", "TIMELINE", "ZERO_BASED"]),
  target: z.number().min(0, "Target must be positive"),
  weightage: z
    .number()
    .min(10, "Minimum weightage is 10%")
    .max(100, "Maximum weightage is 100%"),
  deadline: z.string().min(1, "Deadline is required"),
  isLowerBetter: z.boolean(),
  cycleId: z.string().min(1, "Cycle is required"),
});

export const goalArraySchema = z
  .array(goalSchema)
  .max(8, "Maximum 8 goals allowed")
  .refine(
    (goals) => {
      const total = goals.reduce((sum, g) => sum + g.weightage, 0);
      return Math.abs(total - 100) < 0.01;
    },
    { message: "Total weightage must equal 100%" }
  );

export const checkInSchema = z.object({
  achievement: z.number().optional(),
  completionDate: z.string().optional(),
  status: z.enum(["NOT_STARTED", "ON_TRACK", "COMPLETED"]),
  quarter: z.enum(["Q1", "Q2", "Q3", "Q4"]),
});

export const managerApprovalSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED", "REWORK"]),
  managerComment: z.string().optional(),
  goals: z
    .array(
      z.object({
        id: z.string(),
        target: z.number().optional(),
        weightage: z.number().optional(),
      })
    )
    .optional(),
});

export const userUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  role: z.enum(["EMPLOYEE", "MANAGER", "ADMIN"]).optional(),
  department: z.string().optional(),
  designation: z.string().optional(),
  managerId: z.string().optional().nullable(),
});

export const cycleSchema = z.object({
  name: z.string().min(1, "Cycle name is required"),
  year: z.number().int().min(2020).max(2035),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  isActive: z.boolean(),
});

export type GoalFormData = z.infer<typeof goalSchema>;
export type CheckInFormData = z.infer<typeof checkInSchema>;
export type ManagerApprovalData = z.infer<typeof managerApprovalSchema>;
export type UserUpdateData = z.infer<typeof userUpdateSchema>;
export type CycleFormData = z.infer<typeof cycleSchema>;
