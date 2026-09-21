"use client"

import { useState } from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
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
import { Search, Filter, User, GitBranch, Rocket, Settings, Trash2, ShieldCheck, Package, CheckCircle2, XCircle } from "lucide-react"
import { useAuditLogs } from "@/lib/hooks/use-platform-data"
import { TableSkeleton, ErrorState, EmptyState, Pagination } from "@/components/ui/data-states"
import type { AuditLogEntry } from "@/lib/types"

const targetTypeLabels: Record<string, string> = {
  pipeline: "流水线",
  release: "发布",
  quality_gate: "质量门禁",
  artifact: "产物",
  project: "项目",
  auth: "认证",
}

const targetTypeIcons: Record<string, typeof Settings> = {
  pipeline: GitBranch,
  release: Rocket,
  quality_gate: ShieldCheck,
  artifact: Package,
  project: Settings,
  auth: User,
}

const resultConfig: Record<AuditLogEntry["result"], { label: string; className: string; icon: typeof CheckCircle2 }> = {
  success: { label: "成功", className: "bg-accent-success text-status-success", icon: CheckCircle2 },
  failed: { label: "失败", className: "bg-accent-danger text-status-danger", icon: XCircle },
}

export function AuditLogPage() {
  const [search, setSearch] = useState("")
  const [result, setResult] = useState("all")
  const [targetType, setTargetType] = useState("all")
  const [page, setPage] = useState(1)

  const { data, error, isLoading, mutate } = useAuditLogs({
    search: search || undefined,
    result: result === "all" ? undefined : result,
    targetType: targetType === "all" ? undefined : targetType,
    page,
    pageSize: 10,
  })

  function updateFilter(setter: (v: string) => void) {
    return (value: string) => {
      setter(value)
      setPage(1)
    }
  }

  const total = data?.total ?? 0
  const failedCount = data?.items.filter((l) => l.result === "failed").length ?? 0

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-foreground">审计日志</h1>
        <p className="text-sm text-muted-foreground">追踪所有系统操作和用户活动</p>
      </div>

      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="搜索操作人、动作或目标..."
                value={search}
                onChange={(e) => updateFilter(setSearch)(e.target.value)}
                className="pl-9 h-8 text-xs bg-secondary border-border"
              />
            </div>
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={result} onValueChange={updateFilter(setResult)}>
              <SelectTrigger className="w-32 h-8 text-xs">
                <SelectValue placeholder="结果" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部结果</SelectItem>
                <SelectItem value="success">成功</SelectItem>
                <SelectItem value="failed">失败</SelectItem>
              </SelectContent>
            </Select>
            <Select value={targetType} onValueChange={updateFilter(setTargetType)}>
              <SelectTrigger className="w-32 h-8 text-xs">
                <SelectValue placeholder="目标类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部类型</SelectItem>
                {Object.entries(targetTypeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader className="pb-3 flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-foreground">最近事件</CardTitle>
          {!isLoading && !error && (
            <span className="text-xs text-muted-foreground">
              共 {total} 条{failedCount > 0 && `，当前页 ${failedCount} 条失败`}
            </span>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <TableSkeleton rows={8} columns={6} />
          ) : error ? (
            <ErrorState error={error} onRetry={() => mutate()} className="border-none rounded-none" />
          ) : !data || data.items.length === 0 ? (
            <EmptyState
              filtered={!!search || result !== "all" || targetType !== "all"}
              onClearFilters={() => {
                setSearch("")
                setResult("all")
                setTargetType("all")
                setPage(1)
              }}
              className="border-none rounded-none"
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-xs text-muted-foreground w-40">时间</TableHead>
                    <TableHead className="text-xs text-muted-foreground">操作人</TableHead>
                    <TableHead className="text-xs text-muted-foreground">操作</TableHead>
                    <TableHead className="text-xs text-muted-foreground">目标</TableHead>
                    <TableHead className="text-xs text-muted-foreground">IP</TableHead>
                    <TableHead className="text-xs text-muted-foreground">结果</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((log) => {
                    const Icon = targetTypeIcons[log.targetType] || Settings
                    const ResultIcon = resultConfig[log.result].icon
                    return (
                      <TableRow key={log.id} className="border-border">
                        <TableCell className="text-xs font-mono text-muted-foreground">{log.timestamp}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center">
                              <User className="w-3 h-3 text-muted-foreground" />
                            </div>
                            <span className="text-sm text-foreground">{log.actor}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="text-sm text-foreground">{log.action}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[220px] truncate" title={log.detail}>
                          {log.target}
                        </TableCell>
                        <TableCell className="text-xs font-mono text-muted-foreground">{log.ip}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={`gap-1 ${resultConfig[log.result].className}`}>
                            <ResultIcon className="w-3 h-3" />
                            {resultConfig[log.result].label}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
              {data.totalPages > 1 && (
                <Pagination
                  page={data.page}
                  totalPages={data.totalPages}
                  total={data.total}
                  pageSize={data.pageSize}
                  onPageChange={setPage}
                />
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
