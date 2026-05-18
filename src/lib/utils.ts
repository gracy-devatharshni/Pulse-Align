import { UoM } from "@prisma/client";

export function calculateProgressScore(
  uom: UoM,
  target: number,
  achievement: number | null | undefined,
  isLowerBetter: boolean = false,
  completionDate?: Date | null,
  deadline?: Date | null
): number {
  if (achievement === null || achievement === undefined) return 0;

  switch (uom) {
    case "NUMERIC":
    case "PERCENTAGE":
      if (isLowerBetter) {
        if (target === 0) return achievement === 0 ? 100 : 0;
        return Math.min(100, (target / achievement) * 100);
      }
      if (target === 0) return 0;
      return Math.min(100, (achievement / target) * 100);

    case "ZERO_BASED":
      return achievement === 0 ? 100 : 0;

    case "TIMELINE":
      if (!completionDate || !deadline) return 0;
      const deadlineTime = new Date(deadline).getTime();
      const completionTime = new Date(completionDate).getTime();
      return completionTime <= deadlineTime ? 100 : 0;

    default:
      return 0;
  }
}

export function getActiveQuarter(): string {
  const month = new Date().getMonth() + 1;
  if (month >= 7 && month <= 9) return "Q1";
  if (month >= 10 && month <= 12) return "Q2";
  if (month >= 1 && month <= 3) return "Q3";
  return "Q4";
}

export function isCheckInWindowOpen(quarter: string): boolean {
  const month = new Date().getMonth() + 1;
  const windows: Record<string, number[]> = {
    Q1: [7],
    Q2: [10],
    Q3: [1],
    Q4: [3, 4],
  };
  return windows[quarter]?.includes(month) ?? false;
}

export function getQuarterLabel(quarter: string): string {
  const labels: Record<string, string> = {
    Q1: "Q1 (July)",
    Q2: "Q2 (October)",
    Q3: "Q3 (January)",
    Q4: "Q4 (March/April)",
  };
  return labels[quarter] || quarter;
}

export function formatScore(score: number): string {
  return `${Math.round(score)}%`;
}

export function getScoreColor(score: number): string {
  if (score >= 90) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 70) return "text-blue-600 dark:text-blue-400";
  if (score >= 50) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    SUBMITTED:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    APPROVED:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    REJECTED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    REWORK:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    LOCKED:
      "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
    NOT_STARTED:
      "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    ON_TRACK:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    COMPLETED:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  };
  return colors[status] || colors.DRAFT;
}
