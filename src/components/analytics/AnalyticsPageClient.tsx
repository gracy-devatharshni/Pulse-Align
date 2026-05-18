"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, Cell, PieChart, Pie, Legend
} from "recharts";
import { TrendingUp, Users, Target, Award, BarChart3 } from "lucide-react";
import { cn } from "@/lib/cn";

interface AnalyticsPageClientProps {
  userRole: string;
  userId: string;
}

export function AnalyticsPageClient({ userRole, userId }: AnalyticsPageClientProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cycleId, setCycleId] = useState("");

  useEffect(() => {
    fetch(`/api/analytics${cycleId ? `?cycleId=${cycleId}` : ""}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [cycleId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 skeleton" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 skeleton rounded-xl" />)}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="h-64 skeleton rounded-xl" />
          <div className="h-64 skeleton rounded-xl" />
        </div>
      </div>
    );
  }

  const { analytics = [], orgStats = {} } = data || {};

  const quarterlyData = [
    { quarter: "Q1 (Jul)", score: analytics.reduce((s: number, a: any) => s + (a.quarterlyScores?.[0]?.score || 0), 0) / Math.max(analytics.length, 1) },
    { quarter: "Q2 (Oct)", score: analytics.reduce((s: number, a: any) => s + (a.quarterlyScores?.[1]?.score || 0), 0) / Math.max(analytics.length, 1) },
    { quarter: "Q3 (Jan)", score: analytics.reduce((s: number, a: any) => s + (a.quarterlyScores?.[2]?.score || 0), 0) / Math.max(analytics.length, 1) },
    { quarter: "Q4 (Mar)", score: analytics.reduce((s: number, a: any) => s + (a.quarterlyScores?.[3]?.score || 0), 0) / Math.max(analytics.length, 1) },
  ];

  const statusDist = analytics.reduce((acc: any, a: any) => {
    Object.entries(a.goalsByStatus || {}).forEach(([status, count]) => {
      acc[status] = (acc[status] || 0) + (count as number);
    });
    return acc;
  }, {});

  const pieData = Object.entries(statusDist).map(([status, count]) => ({
    name: status,
    value: count,
  }));

  const PIE_COLORS = ["#000", "#333", "#555", "#777", "#999", "#bbb"];

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {userRole === "EMPLOYEE" ? "Your performance insights" : "Organization performance overview"}
          </p>
        </div>
      </div>

      {/* Org KPIs */}
      {(userRole === "MANAGER" || userRole === "ADMIN") && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Users", value: orgStats.totalUsers || 0, icon: <Users className="w-5 h-5" />, sub: "in scope" },
            { label: "Avg Score", value: `${orgStats.avgScore || 0}%`, icon: <TrendingUp className="w-5 h-5" />, sub: "overall" },
            { label: "Completion Rate", value: `${orgStats.completionRate || 0}%`, icon: <Target className="w-5 h-5" />, sub: "≥80% score" },
            { label: "Top Performers", value: orgStats.topPerformers?.length || 0, icon: <Award className="w-5 h-5" />, sub: "tracked" },
          ].map((card, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="metric-card"
            >
              <div className="w-9 h-9 rounded-lg bg-foreground text-background flex items-center justify-center mb-3">
                {card.icon}
              </div>
              <div className="font-display text-2xl font-bold text-foreground">{card.value}</div>
              <div className="text-sm font-medium text-foreground mt-0.5">{card.label}</div>
              <div className="text-xs text-muted-foreground mt-1">{card.sub}</div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* QoQ Trend */}
        <div className="card-elevated p-6">
          <h2 className="font-display font-semibold text-foreground mb-4">Quarterly Trend</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={quarterlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="quarter" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} domain={[0, 100]} />
              <Tooltip
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }}
              />
              <Bar dataKey="score" fill="hsl(var(--foreground))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Goal Status Distribution */}
        <div className="card-elevated p-6">
          <h2 className="font-display font-semibold text-foreground mb-4">Goal Status Distribution</h2>
          {pieData.length === 0 ? (
            <div className="flex items-center justify-center h-52 text-muted-foreground text-sm">No data available</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  dataKey="value"
                  strokeWidth={2}
                >
                  {pieData.map((_: any, index: number) => (
                    <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }}
                />
                <Legend formatter={(v) => <span style={{ fontSize: 11, color: "hsl(var(--muted-foreground))" }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Department Performance */}
      {(userRole === "MANAGER" || userRole === "ADMIN") && orgStats.departmentPerformance?.length > 0 && (
        <div className="card-elevated p-6">
          <h2 className="font-display font-semibold text-foreground mb-4">Department Performance</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={orgStats.departmentPerformance} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis dataKey="department" type="category" width={120} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }}
              />
              <Bar dataKey="avgScore" fill="hsl(var(--foreground))" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Top Performers Table */}
      {(userRole === "MANAGER" || userRole === "ADMIN") && orgStats.topPerformers?.length > 0 && (
        <div className="card-elevated">
          <div className="p-5 border-b border-border">
            <h2 className="font-display font-semibold text-foreground">Top Performers</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">#</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Employee</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Department</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Score</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Goals</th>
                </tr>
              </thead>
              <tbody>
                {orgStats.topPerformers.map((p: any, i: number) => (
                  <tr key={p.userId} className="border-b border-border table-row-hover">
                    <td className="px-5 py-3 font-mono text-sm text-muted-foreground">{i + 1}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-bold">
                          {p.name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-foreground">{p.name}</div>
                          <div className="text-xs text-muted-foreground">{p.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm text-muted-foreground">{p.department || "—"}</td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-20 weightage-bar">
                          <div className="weightage-bar-fill" style={{ width: `${p.overallScore}%` }} />
                        </div>
                        <span className="font-mono font-bold text-foreground w-10 text-right">{p.overallScore}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-sm text-foreground">{p.totalGoals}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Individual Employee Analytics */}
      {userRole === "EMPLOYEE" && analytics.length > 0 && (
        <div className="card-elevated p-6">
          <h2 className="font-display font-semibold text-foreground mb-4">Your Performance Radar</h2>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={analytics[0]?.quarterlyScores || []}>
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis dataKey="quarter" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
              <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <Radar name="Score" dataKey="score" stroke="hsl(var(--foreground))" fill="hsl(var(--foreground))" fillOpacity={0.15} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
