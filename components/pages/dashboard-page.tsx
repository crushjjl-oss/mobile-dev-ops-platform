"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Activity,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  XCircle,
  Clock,
  Package,
  Zap,
  BarChart3,
  ArrowUpRight,
  Loader2,
  GitBranch,
  AlertTriangle,
} from "lucide-react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  Legend,
} from "recharts"
import { cn } from "@/lib/utils"
import { useDashboard } from "@/lib/hooks/use-platform-data"
import { ErrorState, EmptyState, MetricsSkeleton } from "@/components/ui/data-states"
import type { BuildStatus, DashboardMetric } from "@/lib/types"

const statusConfig: Record<BuildStatus, { icon: typeof CheckCircle2; className: string; bgClass: string }> = {
  success: { icon: CheckCircle2, className: "text-status-success", bgClass: "bg-accent-success" },
  failed: { icon: XCircle, className: "text-status-danger", bgClass: "bg-accent-danger" },
  running: { icon: Loader2, className: "text-status-info", bgClass: "bg-accent-info" },
  cancelled: { icon: AlertTriangle, className: "text-status-warning", bgClass: "bg-accent-warning" },
  pending: { icon: Clock, className: "text-muted-foreground", bgClass: "bg-secondary" },
}

/** 饼图配色跟随语义状态色，浅深色模式共用 */
const PIE_COLORS: Record<string, string> = {
  成功: "hsl(145, 63%, 42%)",
  失败: "hsl(0, 72%, 51%)",
  取消: "hsl(38, 92%, 50%)",
}

const STAT_ICONS = [Package, CheckCircle2, Clock, GitBranch]
const STAT_COLORS = ["hsl(199,89%,48%)", "hsl(145,63%,49%)", "hsl(38,92%,50%)", "hsl(262,52%,55%)"]

export function DashboardPage() {
  const router = useRouter()
  const { data, error, isLoading, mutate } = useDashboard()

  if (isLoading) return <div className="p-6"><MetricsSkeleton count={4} /></div>
  if (error) return <div className="p-6"><ErrorState error={error} onRetry={() => void mutate()} /></div>
  if (!data) return <div className="p-6"><EmptyState title="暂无数据" description="总览数据尚未生成。" /></div>

  const { metrics, trend, rankings, recentBuilds, packageSizeTrend, pendingItems } = data

  // 状态分布由近期构建实时聚合，避免与趋势数据口径不一致
  const statusTally = recentBuilds.reduce<Record<string, number>>((acc, b) => {
    const label = b.status === "success" ? "成功" : b.status === "failed" ? "失败" : "取消"
    acc[label] = (acc[label] ?? 0) + 1
    return acc
  }, {})

  const pieData = Object.entries(statusTally).map(([name, value]) => ({
    name,
    value,
    color: PIE_COLORS[name] ?? "hsl(220,14%,50%)",
  }))

  const maxBuilds = Math.max(...rankings.map((p) => p.builds), 1)

  return (
    <div className="p-6 space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric: DashboardMetric, idx: number) => {
          const Icon = STAT_ICONS[idx] ?? Package
          const color = STAT_COLORS[idx] ?? "hsl(199,89%,48%)"
          const isUp = metric.trend === "up"
          const isFlat = metric.trend === "flat"
          return (
            <Card key={metric.label} className="bg-card border-border group hover:border-[hsl(199,89%,48%)]/20 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: `${color}1a` }}
                  >
                    <Icon className="w-5 h-5" style={{ color }} />
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] font-medium border-0",
                      isFlat
                        ? "bg-secondary text-muted-foreground"
                        : isUp
                          ? "bg-[hsl(145,63%,42%)]/10 text-status-success"
                          : "bg-[hsl(0,72%,51%)]/10 text-status-danger"
                    )}
                  >
                    {!isFlat && (isUp ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />)}
                    {metric.delta > 0 ? "+" : ""}{metric.delta}%
                  </Badge>
                </div>
                <div className="text-2xl font-bold text-foreground tracking-tight">
                  {metric.value}
                  {metric.unit && <span className="text-sm font-normal text-muted-foreground ml-1">{metric.unit}</span>}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">{metric.label}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Build Trend - Large */}
        <Card className="lg:col-span-8 bg-card border-border">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Activity className="w-4 h-4 text-status-info" />
                {"\u6784\u5EFA\u8D8B\u52BF\uFF08\u8FD1 12 \u5929\uFF09"}
              </CardTitle>
              <div className="flex items-center gap-4 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-[hsl(145,63%,49%)]" />
                  <span className="text-muted-foreground">Success</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-[hsl(0,72%,51%)]" />
                  <span className="text-muted-foreground">Failed</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="gradSuccess" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(145, 63%, 49%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(145, 63%, 49%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradFailed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(0, 72%, 55%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(0, 72%, 55%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 18%, 16%)" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(220, 10%, 45%)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(220, 10%, 45%)" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "hsl(222, 22%, 11%)", border: "1px solid hsl(222, 18%, 20%)", borderRadius: 8, fontSize: 12, color: "hsl(220, 14%, 90%)", boxShadow: "0 8px 32px rgba(0,0,0,.3)" }}
                  cursor={{ stroke: "hsl(199,89%,48%)", strokeWidth: 1, strokeDasharray: "4 4" }}
                />
                <Area type="monotone" dataKey="success" stroke="hsl(145, 63%, 49%)" fill="url(#gradSuccess)" strokeWidth={2} />
                <Area type="monotone" dataKey="failed" stroke="hsl(0, 72%, 55%)" fill="url(#gradFailed)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Build Status Pie + Pending */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-1">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
  <BarChart3 className="w-4 h-4 text-status-info" />
  {"\u6784\u5EFA\u72B6\u6001"}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center pb-3">
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={42}
                    outerRadius={62}
                    paddingAngle={3}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "hsl(222, 22%, 11%)", border: "1px solid hsl(222, 18%, 20%)", borderRadius: 8, fontSize: 12, color: "hsl(220, 14%, 90%)" }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex items-center gap-4 text-[11px]">
                {pieData.map((d) => (
                  <div key={d.name} className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="text-muted-foreground">{d.name}</span>
                    <span className="font-semibold text-foreground">{d.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Pending Actions */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
  <AlertTriangle className="w-4 h-4 text-status-warning" />
  {"\u5F85\u5904\u7406\u4E8B\u9879"}
                </CardTitle>
                <Badge variant="secondary" className="text-[10px] bg-[hsl(38,92%,50%)]/10 text-status-warning">{pendingItems.length}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 pb-3">
              {pendingItems.map((item, i) => (
                <div key={i} className="flex items-start gap-2.5 p-2 rounded-md bg-secondary/30 border border-border/50">
                  <div className={cn(
                    "w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0",
                    item.severity === "error" ? "bg-[hsl(0,72%,51%)]" : item.severity === "warning" ? "bg-[hsl(38,92%,50%)]" : "bg-[hsl(199,89%,48%)]"
                  )} />
                  <div className="min-w-0">
                    <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">{item.type}</div>
                    <div className="text-xs text-foreground leading-snug">{item.desc}</div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Lower Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Package Size Trend */}
        <Card className="lg:col-span-4 bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
  <Zap className="w-4 h-4 text-status-info" />
  {"\u5305\u4F53\u79EF\u8D8B\u52BF (MB)"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={packageSizeTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 18%, 16%)" vertical={false} />
                <XAxis dataKey="ver" tick={{ fontSize: 11, fill: "hsl(220, 10%, 45%)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(220, 10%, 45%)" }} domain={[35, 46]} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(222, 22%, 11%)", border: "1px solid hsl(222, 18%, 20%)", borderRadius: 8, fontSize: 12, color: "hsl(220, 14%, 90%)" }} />
                <Line type="monotone" dataKey="android" stroke="hsl(145, 63%, 49%)" strokeWidth={2} dot={{ fill: "hsl(145, 63%, 49%)", r: 3 }} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="ios" stroke="hsl(199, 89%, 48%)" strokeWidth={2} dot={{ fill: "hsl(199, 89%, 48%)", r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-5 mt-2 text-[11px] justify-center">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-[hsl(145,63%,49%)]" />
                <span className="text-muted-foreground">Android</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-[hsl(199,89%,48%)]" />
                <span className="text-muted-foreground">iOS</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Project Builds Ranking */}
        <Card className="lg:col-span-3 bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{"\u9879\u76EE\u6392\u540D"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {rankings.map((p, i) => (
              <div key={p.project} className="flex items-center gap-3">
                <span className={cn(
                  "w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center flex-shrink-0",
                  i === 0 ? "bg-[hsl(38,92%,50%)]/15 text-[hsl(38,92%,38%)] dark:text-[hsl(38,92%,55%)]" :
                  i === 1 ? "bg-[hsl(220,14%,50%)]/15 text-[hsl(220,14%,40%)] dark:text-[hsl(220,14%,70%)]" :
                  i === 2 ? "bg-[hsl(25,80%,45%)]/15 text-[hsl(25,80%,38%)] dark:text-[hsl(25,80%,58%)]" :
                  "bg-secondary text-muted-foreground"
                )}>
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-foreground truncate">{p.project}</span>
                    <span className="text-[10px] text-muted-foreground ml-2">{p.builds}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[hsl(199,89%,48%)] transition-all"
                      style={{ width: `${(p.builds / maxBuilds) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Builds */}
        <Card className="lg:col-span-5 bg-card border-border">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">{"\u6700\u8FD1\u6784\u5EFA"}</CardTitle>
              <Button variant="ghost" size="sm" asChild className="text-xs text-status-info h-7">
                <Link href="/builds">
                  {"\u67E5\u770B\u5168\u90E8"} <ArrowUpRight className="w-3 h-3 ml-1" aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {recentBuilds.map((b) => {
                const sc = statusConfig[b.status]
                const StatusIcon = sc?.icon || CheckCircle2
                return (
                  <Link
                    key={b.id}
                    href={`/builds/${b.id}`}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-secondary/20 transition-colors"
                  >
                    <div className={cn("w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0", sc?.bgClass)}>
                      <StatusIcon
                        className={cn("w-3.5 h-3.5", sc?.className, b.status === "running" && "animate-spin")}
                        aria-hidden="true"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-medium text-status-info">{b.id}</span>
                        <span className="text-xs text-foreground truncate">{b.project}</span>
                        <Badge variant="secondary" className="text-[9px] h-4 px-1.5">{b.platform}</Badge>
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1.5">
                        <GitBranch className="w-3 h-3" />
                        <span className="font-mono truncate">{b.branch}</span>
                        <span className="text-muted-foreground/40">|</span>
                        <span>{b.time}</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-[11px] text-muted-foreground">{b.duration}</div>
                      <div className="text-[10px] text-muted-foreground/70">{b.user}</div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
