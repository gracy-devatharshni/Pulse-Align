"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Download, FileText, Filter, Search, ChevronUp, ChevronDown } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/cn";
import { getStatusColor, calculateProgressScore } from "@/lib/utils";

interface ReportsPageClientProps {
  userRole: string;
  userId: string;
}

export function ReportsPageClient({ userRole, userId }: ReportsPageClientProps) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortField, setSortField] = useState("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const PER_PAGE = 10;

  useEffect(() => {
    fetch("/api/analytics")
      .then((r) => r.json())
      .then((d) => {
        const flat: any[] = [];
        (d.analytics || []).forEach((emp: any) => {
          flat.push({
            name: emp.name,
            email: emp.email,
            department: emp.department || "—",
            totalGoals: emp.totalGoals,
            approvedGoals: emp.approvedGoals,
            overallScore: emp.overallScore,
          });
        });
        setData(flat);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = data
    .filter((r) => {
      const matchSearch = r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.email.toLowerCase().includes(search.toLowerCase());
      return matchSearch;
    })
    .sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      if (typeof valA === "number") return sortDir === "asc" ? valA - valB : valB - valA;
      return sortDir === "asc"
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });

  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const handleSort = (field: string) => {
    if (sortField === field) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  };

  const exportCSV = () => {
    const headers = ["Name", "Email", "Department", "Total Goals", "Approved", "Overall Score"];
    const rows = filtered.map((r) => [
      r.name, r.email, r.department, r.totalGoals, r.approvedGoals, `${r.overallScore}%`
    ]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pulsealign-report-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Report exported as CSV!");
  };

  const exportExcel = () => {
    // Simple TSV that opens in Excel
    const headers = ["Name", "Email", "Department", "Total Goals", "Approved", "Overall Score"];
    const rows = filtered.map((r) => [
      r.name, r.email, r.department, r.totalGoals, r.approvedGoals, `${r.overallScore}%`
    ]);
    const tsv = [headers, ...rows].map((r) => r.join("\t")).join("\n");
    const blob = new Blob([tsv], { type: "application/vnd.ms-excel" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pulsealign-report-${format(new Date(), "yyyy-MM-dd")}.xls`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Report exported as Excel!");
  };

  const SortIcon = ({ field }: { field: string }) => (
    sortField === field
      ? sortDir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
      : <ChevronUp className="w-3 h-3 opacity-30" />
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Reports</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {filtered.length} records · Export and analyze performance data
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV} className="flex items-center gap-2 border border-border px-4 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-accent transition-colors">
            <Download className="w-4 h-4" /> CSV
          </button>
          <button onClick={exportExcel} className="flex items-center gap-2 bg-foreground text-background px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
            <FileText className="w-4 h-4" /> Excel
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            placeholder="Search employees..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="input-premium pl-9"
          />
        </div>
      </div>

      {/* Table */}
      <div className="card-elevated overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                {[
                  { label: "Employee", field: "name" },
                  { label: "Department", field: "department" },
                  { label: "Total Goals", field: "totalGoals" },
                  { label: "Approved", field: "approvedGoals" },
                  { label: "Overall Score", field: "overallScore" },
                ].map((col) => (
                  <th
                    key={col.field}
                    className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors select-none"
                    onClick={() => handleSort(col.field)}
                  >
                    <div className="flex items-center gap-1">
                      {col.label} <SortIcon field={col.field} />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    {[...Array(5)].map((_, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-4 skeleton rounded" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-muted-foreground">No data found</td>
                </tr>
              ) : (
                paginated.map((row, i) => (
                  <motion.tr
                    key={`${row.email}-${i}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-border table-row-hover"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {row.name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-foreground">{row.name}</div>
                          <div className="text-xs text-muted-foreground">{row.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-muted-foreground">{row.department}</td>
                    <td className="px-5 py-4 text-sm font-mono text-foreground">{row.totalGoals}</td>
                    <td className="px-5 py-4 text-sm font-mono text-foreground">{row.approvedGoals}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-24 weightage-bar">
                          <div className="weightage-bar-fill" style={{ width: `${row.overallScore}%` }} />
                        </div>
                        <span className="font-mono font-bold text-sm text-foreground w-10">{row.overallScore}%</span>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filtered.length > PER_PAGE && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-border">
            <span className="text-sm text-muted-foreground">
              Showing {Math.min((page - 1) * PER_PAGE + 1, filtered.length)}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-accent disabled:opacity-40"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page * PER_PAGE >= filtered.length}
                className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-accent disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
