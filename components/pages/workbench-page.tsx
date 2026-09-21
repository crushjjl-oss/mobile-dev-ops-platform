"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ArrowUpRight,
  ArrowRight,
  GitPullRequest,
  ShieldAlert,
  Layers,
  XCircle,
  CheckCircle2,
  Clock,
  FolderPlus,
  GitBranch,
  Boxes,
  Rocket,
  ListChecks,
  PackagePlus,
  Inbox,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useWorkbench } from "@/lib/hooks/use-platform-data"
import { ErrorState, EmptyState, MetricsSkeleton } from "@/components/ui/data-states"
import { BASELINE_STATUS_LABELS, ROLE_LABELS } from "@/lib/types"
import type {
  BaselineStatus,
  WorkbenchActionItem,
  WorkbenchActionKind,
  WorkbenchStat,
} from "@/lib/types"

/** tone / severity → 语义状态色（浅深色模式共用平台既有令牌） */
const TONE_STYLES: Record<
  "danger" | "warning" | "info" | "success",
  { text: string; bg: string; dot: string }
> = {
  danger: { text: "text-status-danger", bg: "bg-accent-danger", dot: "bg-status-danger" },
  warning: { text: "text-status-warning", bg: "bg-accent-warning", dot: "bg-status-warning" },
  info: { text: "text-status-info", bg: "bg-accent-info", dot: "bg-status-info" },
  success: { text: "text-status-success", bg: "bg-accent-success", dot: "bg-status-success" },
}

const ACTION_ICONS: Record<WorkbenchActionKind, typeof GitPullRequest> = {
  release_review: GitPullRequest,
  quality_gate: ShieldAlert,
  baseline: Layers,
  build_failed: XCircle,
}

const SEVERITY_TONE: Record<WorkbenchActionItem["severity"], "danger" | "warning" | "info"> = {
  error: "danger",
  warning: "warning",
  info: "info",
}

/** 组版生命周期顺序，用于进行中版本的迷你进度条 */
const BASELINE_LIFECYCLE: BaselineStatus[] = ["draft", "frozen", "building", "build_success", "testing", "released"]

const QUICK_ACTIONS = [
  { label: "新建组版版本", href: "/integrations", icon: PackagePlus },
  { label: "组件管理", href: "/components", icon: Boxes },
  { label: "新建项目", href: "/projects", icon: FolderPlus },
  { label: "流水线", href: "/pipelines", icon: GitBranch },
  { label: "构建记录", href: "/builds", icon: ListChecks },
  { label: "发布管理", href: "/releases", icon: Rocket },
]

function greeting(): string {
  const h = new Date().getHours()
  if (h < 6) return "夜深了"
  if (h < 12) return "上午好"
  if (h < 14) return "中午好"
  if (h < 18) return "下午好"
  return "晚上好"
}

/** "2026-02-12 14:32:01" → "02-12 14:32" */
function shortTime(t: string): string {
  const m = t.match(/\d{4}-(\d{2}-\d{2})\s+(\d{2}:\d{2})/)
  return m ? `${m[1]} ${m[2]}` : t
}

export function WorkbenchPage() {
  const { data, error, isLoading, mutate } = useWorkbench()

  if (isLoading)
    return (
      <div className="p-6">
        <MetricsSkeleton count={4} />
      </div>
    )
  if (error)
    return (
      <div className="p-6">
        <ErrorState error={error} onRetry={() => void mutate()} />
      </div>
    )
  if (!data)
    return (
      <div className="p-6">
        <EmptyState title="暂无数据" description="工作台数据尚未生成。" />
      </div>
    )

  const { greetingName, role, stats, actionItems, activeVersions, activities } = data
  const pendingTotal = actionItems.length

  return (
    <div className="p-6 space-y-6">
      {/* 问候头 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-foreground text-balance">
            {greeting()}，{greetingName}
          </h1>
          <p className="text-sm text-muted-foreground">
            {pendingTotal > 0 ? (
              <>
                你有 <span className="font-medium text-foreground">{pendingTotal}</span> 项待处理事项
              </>
            ) : (
              "当前没有待处理事项，一切就绪"
            )}
          </p>
        </div>
        <Badge variant="secondary" className="text-xs">
          {ROLE_LABELS[role]}
        </Badge>
      </div>

      {/* 个人指标卡 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s: WorkbenchStat) => {
          const tone = TONE_STYLES[s.tone]
          return (
            <Link key={s.key} href={s.href} className="group">
              <Card className="transition-colors hover:border-foreground/20">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                    <p className={cn("text-3xl font-semibold tabular-nums", s.value > 0 ? tone.text : "text-foreground")}>
                      {s.value}
                    </p>
                  </div>
                  <span className={cn("inline-flex h-9 w-9 items-center justify-center rounded-md", tone.bg)}>
                    <ArrowUpRight className={cn("h-4 w-4 opacity-70 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5", tone.text)} />
                  </span>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧主区：待我处理 + 进行中组版 */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base flex items-center gap-2">
                <Inbox className="h-4 w-4 text-muted-foreground" />
                待我处理
                {pendingTotal > 0 && (
                  <Badge variant="secondary" className="text-[10px]">
                    {pendingTotal}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {actionItems.length === 0 ? (
                <div className="px-6 py-10 text-center">
                  <CheckCircle2 className="mx-auto h-8 w-8 text-status-success" />
                  <p className="mt-2 text-sm text-muted-foreground">暂无待处理事项</p>
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {actionItems.map((item) => {
                    const Icon = ACTION_ICONS[item.kind]
                    const tone = TONE_STYLES[SEVERITY_TONE[item.severity]]
                    return (
                      <li key={item.id} className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/40 transition-colors">
                        <span className={cn("inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md", tone.bg)}>
                          <Icon className={cn("h-4 w-4", tone.text)} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-foreground">{item.title}</p>
                          <p className="truncate text-xs text-muted-foreground">{item.desc}</p>
                        </div>
                        <span className="hidden shrink-0 items-center gap-1 text-[11px] text-muted-foreground sm:inline-flex">
                          <Clock className="h-3 w-3" />
                          {shortTime(item.time)}
                        </span>
                        <Button asChild size="sm" variant="ghost" className="shrink-0 text-xs">
                          <Link href={item.href}>
                            {item.cta}
                            <ArrowRight className="ml-1 h-3 w-3" />
                          </Link>
                        </Button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base flex items-center gap-2">
                <Layers className="h-4 w-4 text-muted-foreground" />
                我参与中的组版
              </CardTitle>
              <Button asChild size="sm" variant="ghost" className="text-xs">
                <Link href="/integrations">
                  全部
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {activeVersions.length === 0 ? (
                <div className="px-6 py-8 text-center text-sm text-muted-foreground">当前没有进行中的组版版本</div>
              ) : (
                <ul className="divide-y divide-border">
                  {activeVersions.map((v) => {
                    const activeIdx = BASELINE_LIFECYCLE.indexOf(v.status)
                    return (
                      <li key={v.version} className="px-4 py-3 hover:bg-secondary/40 transition-colors">
                        <Link href={`/integrations/${encodeURIComponent(v.version)}`} className="block space-y-2">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="font-mono text-sm font-medium text-foreground">{v.version}</span>
                              <Badge variant="secondary" className="text-[10px]">
                                {BASELINE_STATUS_LABELS[v.status]}
                              </Badge>
                            </div>
                            <span className="shrink-0 text-[11px] text-muted-foreground">{v.componentCount} 个组件</span>
                          </div>
                          {v.description && <p className="truncate text-xs text-muted-foreground">{v.description}</p>}
                          <div className="flex items-center gap-1 pt-1">
                            {BASELINE_LIFECYCLE.map((step, i) => (
                              <span
                                key={step}
                                className={cn(
                                  "h-1.5 flex-1 rounded-full",
                                  i <= activeIdx ? "bg-status-info" : "bg-secondary",
                                )}
                              />
                            ))}
                          </div>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 右侧：快捷入口 + 近期动态 */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">快捷入口</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {QUICK_ACTIONS.map((a) => {
                  const Icon = a.icon
                  return (
                    <Link
                      key={a.href}
                      href={a.href}
                      className="flex flex-col items-start gap-2 rounded-lg border border-border p-3 transition-colors hover:border-foreground/20 hover:bg-secondary/40"
                    >
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs font-medium text-foreground">{a.label}</span>
                    </Link>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">我的近期动态</CardTitle>
              <Button asChild size="sm" variant="ghost" className="text-xs">
                <Link href="/audit">
                  更多
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {activities.length === 0 ? (
                <div className="px-6 py-8 text-center text-sm text-muted-foreground">暂无动态</div>
              ) : (
                <ul className="divide-y divide-border">
                  {activities.map((a) => (
                    <li key={a.id} className="flex items-start gap-3 px-4 py-3">
                      <span
                        className={cn(
                          "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                          a.result === "failed" ? "bg-status-danger" : "bg-status-success",
                        )}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-foreground">
                          <span className="font-medium">{a.mine ? "我" : a.actor}</span>
                          <span className="text-muted-foreground"> {a.action} </span>
                          <span className="truncate">{a.target}</span>
                        </p>
                        <p className="text-[11px] text-muted-foreground">{shortTime(a.time)}</p>
                      </div>
                      {a.mine && (
                        <Badge variant="outline" className="shrink-0 text-[10px]">
                          我
                        </Badge>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
