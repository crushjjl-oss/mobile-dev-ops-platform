"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertTriangle, CheckCircle2, XCircle, ShieldCheck, Ban } from "lucide-react"
import { useQualityGateRules, useQualityGateRuns } from "@/lib/hooks/use-platform-data"
import { TableSkeleton, CardGridSkeleton, ErrorState, EmptyState, Pagination } from "@/components/ui/data-states"
import type { QualityGateRun } from "@/lib/types"

const resultConfig: Record<QualityGateRun["result"], { label: string; className: string; icon: typeof CheckCircle2 }> = {
  passed: { label: "通过", className: "bg-accent-success text-status-success", icon: CheckCircle2 },
  warning: { label: "警告", className: "bg-accent-warning text-status-warning", icon: AlertTriangle },
  failed: { label: "未通过", className: "bg-accent-danger text-status-danger", icon: XCircle },
}

export function QualityGatePage() {
  const [page, setPage] = useState(1)
  const { data: rules, error: rulesError, isLoading: rulesLoading, mutate: mutateRules } = useQualityGateRules()
  const { data: runs, error: runsError, isLoading: runsLoading, mutate: mutateRuns } = useQualityGateRuns({ page, pageSize: 10 })

  const passedRuns = runs?.items.filter((r) => r.result === "passed").length ?? 0
  const warningRuns = runs?.items.filter((r) => r.result === "warning").length ?? 0
  const failedRuns = runs?.items.filter((r) => r.result === "failed").length ?? 0

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-foreground">质量门禁</h1>
        <p className="text-sm text-muted-foreground">质量规则配置与构建检查结果</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-accent-info flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-status-info" />
            </div>
            <div>
              <div className="text-xl font-bold text-foreground">{rules?.length ?? "—"}</div>
              <div className="text-xs text-muted-foreground">质量规则</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-accent-success flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-status-success" />
            </div>
            <div>
              <div className="text-xl font-bold text-foreground">{passedRuns}</div>
              <div className="text-xs text-muted-foreground">当前页通过</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-accent-warning flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-status-warning" />
            </div>
            <div>
              <div className="text-xl font-bold text-foreground">{warningRuns}</div>
              <div className="text-xs text-muted-foreground">当前页警告</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-accent-danger flex items-center justify-center">
              <XCircle className="w-5 h-5 text-status-danger" />
            </div>
            <div>
              <div className="text-xl font-bold text-foreground">{failedRuns}</div>
              <div className="text-xs text-muted-foreground">当前页未通过</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="runs">
        <TabsList className="bg-secondary">
          <TabsTrigger value="runs">检查记录</TabsTrigger>
          <TabsTrigger value="rules">质量规则</TabsTrigger>
        </TabsList>

        <TabsContent value="runs" className="mt-4">
          {runsLoading ? (
            <TableSkeleton rows={5} columns={4} />
          ) : runsError ? (
            <ErrorState error={runsError} onRetry={() => mutateRuns()} />
          ) : !runs || runs.items.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="border border-border rounded-lg divide-y divide-border">
              {runs.items.map((run) => {
                const config = resultConfig[run.result]
                const Icon = config.icon
                return (
                  <div key={run.id} className="flex items-center gap-4 p-4">
                    <Badge variant="secondary" className={`text-[10px] gap-1 ${config.className}`}>
                      <Icon className="w-3 h-3" />
                      {config.label}
                    </Badge>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono text-status-info">{run.id}</span>
                        <span className="text-sm text-foreground">{run.project}</span>
                        <span className="text-xs text-muted-foreground">构建 #{run.buildId}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {run.passedCount} / {run.totalCount} 项规则通过
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">{run.checkedAt}</div>
                  </div>
                )
              })}
              {runs.totalPages > 1 && (
                <Pagination
                  page={runs.page}
                  totalPages={runs.totalPages}
                  total={runs.total}
                  pageSize={runs.pageSize}
                  onPageChange={setPage}
                />
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="rules" className="mt-4">
          {rulesLoading ? (
            <CardGridSkeleton count={4} />
          ) : rulesError ? (
            <ErrorState error={rulesError} onRetry={() => mutateRules()} />
          ) : !rules || rules.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rules.map((rule) => (
                <Card key={rule.id} className="bg-card border-border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-status-info" />
                        <span className="text-sm font-medium text-foreground">{rule.name}</span>
                        {rule.blocking && (
                          <Badge variant="secondary" className="text-[10px] gap-1 bg-accent-danger text-status-danger">
                            <Ban className="w-3 h-3" />
                            阻断发布
                          </Badge>
                        )}
                      </div>
                      <Switch checked={rule.enabled} disabled />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      指标 <span className="font-mono text-foreground">{rule.metric}</span>{" "}
                      要求
                      <span className="font-mono text-foreground">
                        {" "}
                        {rule.operator} {rule.threshold}
                        {rule.unit}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
