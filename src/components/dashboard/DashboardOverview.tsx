"use client";

import { motion } from "framer-motion";
import {
  Target, TrendingUp, CheckSquare, Clock,
  AlertCircle, ArrowRight, Zap, Shield
} from "lucide-react";
import {
  RadialBarChart, RadialBar, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { format, formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { getStatusColor, calculateProgressScore } from "@/lib/utils";

interface DashboardOverviewProps {
  data: {
    user: any;
    activeCycle: any;
    goals: any[];
    notifications: any[];
    pendingApprovals: number;
  };
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] as any } },
};

export function DashboardOverview({ data }: DashboardOverviewProps) {
  const { user, activeCycle, goals, notifications, pendingApprovals } = data;

  const totalWeightage = goals.reduce((sum, g) => sum + g.weightage, 0);
  const approvedGoals = goals.filter((g) => ["APPROVED", "LOCKED"].includes(g.status));
  const submittedGoals = goals.filter((g) => g.status === "SUBMITTED");
  const draftGoals = goals.filter((g) => g.status === "DRAFT");

  // Calculate overall progress
  const overallProgress =
    approvedGoals.length > 0
      ? approvedGoals.reduce((sum, g) => {
          const latestCheckIn = g.checkIns?.[g.checkIns.length - 1];
          const score = latestCheckIn
            ? calculateProgressScore(g.uom, g.target, latestCheckIn.achievement, g.isLowerBetter)
            : 0;
          return sum + score * (g.weightage / 100);
        }, 0)
      : 0;

  // Trend data (mock for sparkline)
  const trendData = [
    { month: "Jul", score: 0 },
    { month: "Aug", score: 12 },
    { month: "Sep", score: 25 },
    { month: "Oct", score: 38 },
    { month: "Nov", score: Math.round(overallProgress) },
  ];

  const radialData = [
    {
      name: "Progress",
      value: Math.round(overallProgress),
      fill: "hsl(var(--foreground))",
    },
  ];

  const roleLabel: Record<string, string> = {
    EMPLOYEE: "Employee",
    MANAGER: "Manager",
    ADMIN: "Admin / HR",
  };

  return (
    <motion.div
      className="space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground tracking-tight">
            Good {getGreeting()}, {user.name.split(" ")[0]}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {activeCycle
              ? `Active cycle: ${activeCycle.name}`
              : "No active cycle. Contact your Admin."}
            {" · "}
            <span className="font-medium text-foreground">{roleLabel[user.role]}</span>
          </p>
        </div>
        <Link
          href="/dashboard/goals/new"
          className="hidden sm:flex items-center gap-2 bg-foreground text-background px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Target className="w-4 h-4" />
          Set Goals
        </Link>
      </motion.div>

      {/* KPI Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Overall Progress"
          value={`${Math.round(overallProgress)}%`}
          icon={<TrendingUp className="w-5 h-5" />}
          sub={`${approvedGoals.length} approved goals`}
          highlight
        />
        <MetricCard
          label="Goals Set"
          value={goals.length.toString()}
          icon={<Target className="w-5 h-5" />}
          sub={`of 8 maximum`}
        />
        <MetricCard
          label="Pending Review"
          value={submittedGoals.length.toString()}
          icon={<Clock className="w-5 h-5" />}
          sub="awaiting manager"
        />
        {user.role !== "EMPLOYEE" ? (
          <MetricCard
            label="Pending Approvals"
            value={pendingApprovals.toString()}
            icon={<Shield className="w-5 h-5" />}
            sub="team submissions"
            urgent={pendingApprovals > 0}
          />
        ) : (
          <MetricCard
            label="Draft Goals"
            value={draftGoals.length.toString()}
            icon={<AlertCircle className="w-5 h-5" />}
            sub="not yet submitted"
          />
        )}
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Progress Chart */}
        <motion.div variants={itemVariants} className="lg:col-span-2 card-elevated p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-display font-semibold text-foreground">Performance Trend</h2>
              <p className="text-sm text-muted-foreground">Score progression this cycle</p>
            </div>
            <div className="text-right">
              <div className="font-display text-2xl font-bold text-foreground">
                {Math.round(overallProgress)}%
              </div>
              <div className="text-xs text-muted-foreground">Current Score</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--foreground))" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="hsl(var(--foreground))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} domain={[0, 100]} />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
              />
              <Area
                type="monotone"
                dataKey="score"
                stroke="hsl(var(--foreground))"
                strokeWidth={2}
                fill="url(#scoreGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Goals Status */}
        <motion.div variants={itemVariants} className="card-elevated p-6">
          <h2 className="font-display font-semibold text-foreground mb-4">Goals Overview</h2>
          <div className="space-y-3">
            {goals.length === 0 ? (
              <div className="text-center py-8">
                <Target className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No goals yet</p>
                <Link
                  href="/dashboard/goals/new"
                  className="text-sm font-medium text-foreground underline mt-1 inline-block"
                >
                  Set your first goal
                </Link>
              </div>
            ) : (
              goals.slice(0, 6).map((goal) => (
                <div key={goal.id} className="flex items-center gap-3 group">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">{goal.title}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={cn("status-badge text-xs", getStatusColor(goal.status))}>
                        {goal.status}
                      </span>
                      <span className="text-xs text-muted-foreground font-mono">{goal.weightage}%</span>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-xs font-mono font-bold text-foreground">
                    {goal.weightage}
                  </div>
                </div>
              ))
            )}
          </div>
          {goals.length > 0 && (
            <Link
              href="/dashboard/goals"
              className="mt-4 w-full flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors border border-border rounded-lg py-2"
            >
              View all goals <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </motion.div>
      </div>

      {/* Weightage Summary */}
      <motion.div variants={itemVariants} className="card-elevated p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-semibold text-foreground">Weightage Distribution</h2>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Total:</span>
            <span className={cn(
              "font-mono font-bold",
              Math.abs(totalWeightage - 100) < 0.01 ? "text-foreground" : "text-red-500"
            )}>
              {totalWeightage}%
            </span>
            <span className="text-muted-foreground">/ 100%</span>
          </div>
        </div>
        <div className="weightage-bar">
          <motion.div
            className="weightage-bar-fill"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(totalWeightage, 100)}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>0%</span>
          <span>100%</span>
        </div>
      </motion.div>

      {/* Notifications */}
      {notifications.length > 0 && (
        <motion.div variants={itemVariants} className="card-elevated p-6">
          <h2 className="font-display font-semibold text-foreground mb-4">Recent Notifications</h2>
          <div className="space-y-3">
            {notifications.map((n) => (
              <div key={n.id} className="flex items-start gap-3 p-3 rounded-lg bg-secondary">
                <div className="notification-dot mt-1.5" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground">{n.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{n.message}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

function MetricCard({
  label, value, icon, sub, highlight, urgent,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  sub: string;
  highlight?: boolean;
  urgent?: boolean;
}) {
  return (
    <div className={cn(
      "metric-card hover-lift",
      highlight && "border-foreground",
      urgent && "border-red-500"
    )}>
      <div className="flex items-center justify-between mb-3">
        <div className={cn(
          "w-9 h-9 rounded-lg flex items-center justify-center",
          highlight ? "bg-foreground text-background" : "bg-secondary text-muted-foreground"
        )}>
          {icon}
        </div>
        {urgent && <div className="notification-dot" />}
      </div>
      <div className="font-display text-2xl font-bold text-foreground tracking-tight">{value}</div>
      <div className="text-sm font-medium text-foreground mt-0.5">{label}</div>
      <div className="text-xs text-muted-foreground mt-1">{sub}</div>
    </div>
  );
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}
