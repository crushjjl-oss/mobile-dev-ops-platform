"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Search,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertTriangle,
  GitBranch,
  Download,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Package,
  TrendingUp,
  Clock,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useBuilds, useBuildStats, useProjects } from "@/lib/hooks/use-platform-data"
import { ErrorState, EmptyState, TableSkeleton, Pagination } from "@/components/ui/data-states"

const statusConfig: Record<string, { icon: typeof CheckCircle2; label: string; className: string; badgeClass: string }> = {
  success: { icon: CheckCircle2, label: "\u6210\u529F", className: "text-status-success", badgeClass: "bg-[hsl(145,63%,42%)]/10 text-status-success border-[hsl(145,63%,42%)]/20" },
  failed: { icon: XCircle, label: "\u5931\u8D25", className: "text-status-danger", badgeClass: "bg-[hsl(0,72%,51%)]/10 text-status-danger border-[hsl(0,72%,51%)]/20" },
  running: { icon: Loader2, label: "\u8FD0\u884C\u4E2D", className: "text-status-info", badgeClass: "bg-[hsl(199,89%,48%)]/10 text-status-info border-[hsl(199,89%,48%)]/20" },
  cancelled: { icon: AlertTriangle, label: "\u5DF2\u53D6\u6D88", className: "text-status-warning", badgeClass: "bg-[hsl(38,92%,50%)]/10 text-status-warning border-[hsl(38,92%,50%)]/20" },
}

export function BuildHistoryPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pipelineParam = searchParams.get("pipeline") ?? undefined

  const [statusFilter, setStatusFilter] = useState("all")
  const [projectFilter, setProjectFilter] = useState("all")
  const [keyword, setKeyword] = useState("")
  const [page, setPage] = useState(1)

  const { data, error, isLoading, mutate, isValidating } = useBuilds({
    page,
    pageSize: 10,
    status: statusFilter === "all" ? undefined : statusFilter,
    project: projectFilter === "all" ? undefined : projectFilter,
    pipelineId: pipelineParam,
    q: keyword || undefined,
  })
  const { data: stats } = useBuildStats()
  const { data: projectsData } = useProjects({ pageSize: 100 })

  // 筛选条件变化时回到第一页，避免停留在超出范围的页码上
  const resetPage = <T,>(setter: (v: T) => void) => (value: T) => {
    setter(value)
    setPage(1)
  }

  if (error) {
    return <div className="p-6"><ErrorState error={error} onRetry={() => void mutate()} /></div>
  }

  const builds = data?.items ?? []
  const projectOptions = projectsData?.items ?? []

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">{"\u6784\u5EFA\u8BB0\u5F55"}</h1>
          <p className="text-sm text-muted-foreground">{"\u67E5\u770B\u6240\u6709\u6784\u5EFA\u5386\u53F2\u548C\u4EA7\u7269"}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void mutate()} disabled={isValidating}>
          <RefreshCw className={cn("w-4 h-4 mr-2", isValidating && "animate-spin")} />
          {"\u5237\u65B0"}
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { key: "total", label: "\u603B\u6784\u5EFA\u6570", value: stats?.total, icon: Package, color: "hsl(199,89%,48%)" },
          { key: "success", label: "\u6210\u529F", value: stats?.success, icon: CheckCircle2, color: "hsl(145,63%,49%)" },
          { key: "failed", label: "\u5931\u8D25", value: stats?.failed, icon: XCircle, color: "hsl(0,72%,51%)" },
          { key: "running", label: "\u8FD0\u884C\u4E2D", value: stats?.running, icon: Loader2, color: "hsl(199,89%,48%)" },
        ].map((stat) => (
          <Card key={stat.key} className="bg-card border-border">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${stat.color}15` }}>
                <stat.icon className={cn("w-5 h-5", stat.key === "running" && "animate-spin")} style={{ color: stat.color }} />
              </div>
              <div>
                <div className="text-lg font-bold text-foreground leading-tight">
                  {stat.value === undefined ? <span className="inline-block h-5 w-8 rounded bg-muted animate-pulse" /> : stat.value}
                </div>
                <div className="text-[11px] text-muted-foreground">{stat.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={"\u6309\u7F16\u53F7\u3001\u9879\u76EE\u3001\u5206\u652F\u641C\u7D22..."}
            className="pl-9"
            value={keyword}
            onChange={(e) => { setKeyword(e.target.value); setPage(1) }}
            aria-label={"\u641C\u7D22\u6784\u5EFA\u8BB0\u5F55"}
          />
        </div>
        <Select value={projectFilter} onValueChange={resetPage(setProjectFilter)}>
          <SelectTrigger className="w-40" aria-label={"\u9879\u76EE\u7B5B\u9009"}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{"\u5168\u90E8\u9879\u76EE"}</SelectItem>
            {projectOptions.map((p) => (
              <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={resetPage(setStatusFilter)}>
          <SelectTrigger className="w-36" aria-label={"\u72B6\u6001\u7B5B\u9009"}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{"\u5168\u90E8\u72B6\u6001"}</SelectItem>
            {Object.entries(statusConfig).map(([key, cfg]) => (
              <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Builds Table */}
      {isLoading ? (
        <TableSkeleton rows={10} columns={9} />
      ) : builds.length === 0 ? (
        <EmptyState
          icon={Package}
          title={"\u672A\u627E\u5230\u6784\u5EFA\u8BB0\u5F55"}
          description={keyword || statusFilter !== "all" || projectFilter !== "all" || pipelineParam
            ? "\u5F53\u524D\u7B5B\u9009\u6761\u4EF6\u4E0B\u6CA1\u6709\u5339\u914D\u7684\u6784\u5EFA\uFF0C\u8BF7\u8C03\u6574\u7B5B\u9009\u6761\u4EF6\u3002"
            : "\u8FD8\u6CA1\u6709\u4EFB\u4F55\u6784\u5EFA\u8BB0\u5F55\u3002"}
        />
      ) : (
      <Card className="bg-card border-border overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b border-border bg-secondary/30">
                <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider w-20">{"\u7F16\u53F7"}</TableHead>
                <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{"\u72B6\u6001"}</TableHead>
                <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{"\u9879\u76EE / \u6D41\u6C34\u7EBF"}</TableHead>
                <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{"\u5206\u652F"}</TableHead>
                <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{"\u5E73\u53F0"}</TableHead>
                <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{"\u8017\u65F6"}</TableHead>
                <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{"\u89E6\u53D1\u4EBA"}</TableHead>
                <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{"\u65F6\u95F4"}</TableHead>
                <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {builds.map((build) => {
                const sc = statusConfig[build.status]
                const StatusIcon = sc?.icon || CheckCircle2
                return (
                  <TableRow
                    key={build.id}
                    className="cursor-pointer hover:bg-secondary/20 transition-colors border-b border-border/50 group"
                    onClick={() => router.push(`/builds/${build.id}`)}
                  >
                    <TableCell className="font-mono text-xs font-semibold text-status-info">
                      <Link href={`/builds/${build.id}`} onClick={(e) => e.stopPropagation()} className="hover:underline">
                        #{build.number}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("text-[10px] gap-1 font-medium", sc?.badgeClass)}>
                        <StatusIcon className={cn("w-3 h-3", sc?.className, build.status === "running" && "animate-spin")} />
                        {sc?.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs font-medium text-foreground">{build.project}</div>
                      <div className="text-[11px] text-muted-foreground">{build.pipeline}</div>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <GitBranch className="w-3 h-3 flex-shrink-0" />
                        <code className="font-mono truncate max-w-[140px] block">{build.branch}</code>
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-[10px] font-normal">{build.platform}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3 flex-shrink-0" />
                        {build.duration}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{build.user}</TableCell>
                    <TableCell className="text-[11px] text-muted-foreground whitespace-nowrap">{build.time}</TableCell>
                    <TableCell>
                      {build.artifacts > 0 && (
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                          <Download className="w-3.5 h-3.5 text-muted-foreground" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      )}

      {data && data.total > 0 && (
        <Pagination
          page={data.page}
          pageSize={data.pageSize}
          total={data.total}
          totalPages={data.totalPages}
          onPageChange={setPage}
        />
      )}
    </div>
  )
}
