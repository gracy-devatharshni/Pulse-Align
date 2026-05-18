import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Zap, Target, BarChart3, Shield, CheckCircle, ArrowRight, Users, Clock } from "lucide-react";

export default async function HomePage() {
  const { userId } = await auth();
  if (userId) redirect("/dashboard");

  return (
    <main className="min-h-screen bg-background text-foreground overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-foreground rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-background" />
            </div>
            <span className="font-display font-bold text-foreground text-lg">PulseAlign</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/sign-in" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="bg-foreground text-background px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border text-sm text-muted-foreground mb-8">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            AI-powered goal alignment for modern teams
          </div>

          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold text-foreground tracking-tight leading-[1.08] text-balance">
            Align your team goals
            <br />
            <span className="gradient-text">with confidence</span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto text-balance leading-relaxed">
            PulseAlign replaces spreadsheets and manual reviews with a structured,
            workflow-driven performance management experience made for enterprise teams.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
            <Link
              href="/sign-up"
              className="flex items-center gap-2 bg-foreground text-background px-6 py-3 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity hover-lift"
            >
              Start free trial <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/sign-in"
              className="flex items-center gap-2 border border-border text-foreground px-6 py-3 rounded-xl text-sm font-medium hover:bg-accent transition-colors"
            >
              Sign in to account
            </Link>
          </div>
        </div>

        {/* Feature Pills */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-12">
          {["OKR Management", "Manager Approvals", "Quarterly Check-ins", "Analytics Dashboard", "Audit Trail", "Role-based Access", "CSV/Excel Export", "Shared Goals"].map((f) => (
            <div key={f} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary text-sm text-foreground">
              <CheckCircle className="w-3.5 h-3.5 text-muted-foreground" />
              {f}
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 border-y border-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            {[
              { value: "3", label: "User Roles", sub: "Employee, Manager, Admin" },
              { value: "8", label: "Max Goals", sub: "per cycle per user" },
              { value: "4", label: "Quarters", sub: "Q1 through Q4 tracking" },
              { value: "∞", label: "Audit Trail", sub: "Complete history" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="font-display text-4xl font-bold text-foreground">{stat.value}</div>
                <div className="font-medium text-foreground mt-1">{stat.label}</div>
                <div className="text-sm text-muted-foreground mt-0.5">{stat.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
            Everything you need
          </h2>
          <p className="text-muted-foreground mt-3 text-lg max-w-xl mx-auto">
            A complete performance management platform for every role in your organization.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: <Target className="w-6 h-6" />,
              title: "Goal Sheets & Validation",
              desc: "Employees draft up to 8 goals with thrust areas, targets, UoM, deadlines, and enforced 100% weightage validation."
            },
            {
              icon: <Shield className="w-6 h-6" />,
              title: "Manager Approvals",
              desc: "Managers review submissions, approve, reject, or return for rework with inline editing and feedback loops."
            },
            {
              icon: <Clock className="w-6 h-6" />,
              title: "Quarterly Check-ins",
              desc: "Structured Q1–Q4 review windows with planned vs actual comparison, status tracking, and progress scoring."
            },
            {
              icon: <BarChart3 className="w-6 h-6" />,
              title: "Analytics & Reporting",
              desc: "Beautiful KPI dashboards, completion heatmaps, and export-ready reports for teams and leadership."
            },
            {
              icon: <Users className="w-6 h-6" />,
              title: "Shared Goals",
              desc: "Create linked KPIs for teams and departments while keeping titles and targets read-only for employees."
            },
            {
              icon: <CheckCircle className="w-6 h-6" />,
              title: "Audit & Compliance",
              desc: "Timeline-style audit logging for approvals, edits, unlocks, and role-based activity tracking."
            },
          ].map((feature, i) => (
            <div key={i} className="card-elevated p-6 hover-lift">
              <div className="w-11 h-11 rounded-xl bg-foreground text-background flex items-center justify-center mb-4">
                {feature.icon}
              </div>
              <h3 className="font-display font-semibold text-foreground text-lg mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Role Cards */}
      <section className="py-20 px-6 border-t border-border">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
              Built for every role
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                role: "Employee",
                color: "bg-zinc-950/90 border-zinc-700",
                badgeColor: "bg-cyan-950/80 text-cyan-300",
                items: [
                  "Create and submit goals",
                  "View locked approved goals",
                  "Update quarterly achievements",
                  "Track personal progress",
                  "View notifications",
                ]
              },
              {
                role: "Manager (L1)",
                color: "bg-zinc-950/90 border-zinc-700",
                badgeColor: "bg-violet-950/80 text-violet-300",
                items: [
                  "Review team submissions",
                  "Approve / reject / rework",
                  "Inline edit targets & weights",
                  "Add structured comments",
                  "View team performance",
                ]
              },
              {
                role: "Admin / HR",
                color: "bg-zinc-950/90 border-zinc-700",
                badgeColor: "bg-fuchsia-950/80 text-fuchsia-300",
                items: [
                  "Manage all users & roles",
                  "Create performance cycles",
                  "Unlock goal submissions",
                  "Org-wide analytics",
                  "Full audit trail access",
                ]
              },
            ].map((card) => (
              <div key={card.role} className={`p-6 rounded-xl border ${card.color}`}>
                <span className={`status-badge mb-4 inline-flex ${card.badgeColor}`}>{card.role}</span>
                <ul className="space-y-2.5">
                  {card.items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-foreground">
                      <CheckCircle className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 border-t border-border">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-display text-4xl font-bold text-foreground">
            Ready to transform<br />performance management?
          </h2>
          <p className="text-muted-foreground mt-4 text-lg">
            Replace your spreadsheets with a system that actually works.
          </p>
          <Link
            href="/sign-up"
            className="inline-flex items-center gap-2 mt-8 bg-foreground text-background px-8 py-3.5 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity hover-lift"
          >
            Get started free <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-foreground rounded flex items-center justify-center">
              <Zap className="w-3 h-3 text-background" />
            </div>
            <span className="font-display font-bold text-foreground text-sm">PulseAlign</span>
          </div>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} PulseAlign. Built for modern performance teams.
          </p>
        </div>
      </footer>
    </main>
  );
}
