"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { useSWRConfig } from "swr"
import { QRCodeSVG } from "qrcode.react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  Snowflake,
  Play,
  Rocket,
  Tag,
  Smartphone,
  GitCommit,
  FlaskConical,
  Loader2,
  Package,
} from "lucide-react"
import { usePageTitle } from "@/components/layout/app-shell"
import { cn } from "@/lib/utils"
import {
  useIntegrationBaseline,
  useTestSubmissions,
  useBaselineChangesets,
} from "@/lib/hooks/use-platform-data"
import { BASELINE_STATUS_LABELS, COMPONENT_TYPE_LABELS } from "@/lib/types"
import type { BaselineStatus } from "@/lib/types"
import { ErrorState, EmptyState, TableSkeleton } from "@/components/ui/data-states"
import { statusBadgeStyle } from "@/components/pages/version-release-list-page"

// 每个生命周期阶段对应「下一步」主操作是否可用
function canFreeze(s: BaselineStatus) {
  return s === "draft"
}
function canSubmitTest(s: BaselineStatus) {
  return s === "build_success" || s === "testing"
}
function canRelease(s: BaselineStatus) {
  return s === "testing"
}

const lifecycleSteps: { key: BaselineStatus; label: string }[] = [
  { key: "draft", label: "草稿" },
  { key: "frozen", label: "冻结" },
  { key: "building", label: "组版构建" },
  { key: "build_success", label: "构建成功" },
  { key: "testing", label: "提测中" },
  { key: "released", label: "已发版" },
]

export function VersionReleaseDetailPage({ version }: { version: string }) {
  const router = useRouter()
  const { mutate: globalMutate } = useSWRConfig()

  const { data: detail, error, isLoading, mutate } = useIntegrationBaseline(version)
  const { data: submissions, mutate: mutateSubmissions } = useTestSubmissions(version)
  const { data: changesets } = useBaselineChangesets(version)

  usePageTitle(detail ? `版本 ${detail.version}` : null)

  const [action, setAction] = useState<null | "freeze" | "test" | "release">(null)
  const [running, setRunning] = useState(false)
  const [testNote, setTestNote] = useState("")

  async function runLifecycle(kind: "freeze" | "test" | "release") {
    if (!detail) return
    setRunning(true)
    try {
      const endpoint =
        kind === "freeze"
          ? `/api/integration-baselines/${encodeURIComponent(version)}/freeze`
          : kind === "test"
            ? `/api/integration-baselines/${encodeURIComponent(version)}/test-submissions`
            : `/api/integration-baselines/${encodeURIComponent(version)}/release`
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: kind === "test" ? JSON.stringify({ note: testNote.trim() || undefined }) : "{}",
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body?.message ?? "操作失败")
      if (kind === "freeze") toast.success("依赖清单已冻结，组版构建已触发")
      else if (kind === "test") {
        toast.success("已提测，可扫码安装测试")
        setTestNote("")
      } else toast.success(`已正式发版，标签 ${body.tag ?? ""}`)
      await mutate()
      await mutateSubmissions()
      void globalMutate((key) => typeof key === "string" && key.startsWith("/api/integration-baselines"))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "操作失败，请稍后重试")
    } finally {
      setRunning(false)
      setAction(null)
    }
  }

  if (isLoading) return <div className="p-6"><TableSkeleton rows={6} columns={5} /></div>
  if (error) return <div className="p-6"><ErrorState error={error} onRetry={() => void mutate()} /></div>
  if (!detail) return <div className="p-6"><EmptyState title="版本不存在" description="该组版版本可能已被删除" /></div>

  const currentStepIndex = lifecycleSteps.findIndex((s) => s.key === detail.status)
  const publishedCount = detail.resolvedComponents.filter((r) => r.source === "published").length
  const editable = detail.status === "draft"

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => router.push("/integrations")}>
          <ArrowLeft className="w-4 h-4" />
          <span className="sr-only">返回</span>
        </Button>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-lg font-semibold font-mono text-foreground">{detail.version}</h1>
          <Badge className={cn("text-[10px] border-0", statusBadgeStyle[detail.status])}>
            {BASELINE_STATUS_LABELS[detail.status]}
          </Badge>
          {detail.previousVersion && (
            <span className="text-xs text-muted-foreground">
              基于基线 <span className="font-mono">{detail.previousVersion}</span>
            </span>
          )}
          {detail.tag && (
            <span className="inline-flex items-center gap-1 text-xs text-status-success font-mono">
              <Tag className="w-3 h-3" />
              {detail.tag}
            </span>
          )}
        </div>
      </div>

      {/* 生命周期进度条 */}
      <Card className="bg-card border-border">
        <CardContent className="py-4">
          <div className="flex items-center">
            {lifecycleSteps.map((step, i) => {
              const done = i < currentStepIndex
              const active = i === currentStepIndex
              return (
                <div key={step.key} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center gap-1">
                    <div
                      className={cn(
                        "w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-medium border",
                        done && "bg-status-success/10 text-status-success border-status-success/30",
                        active && "bg-[hsl(199,89%,48%)]/10 text-status-info border-status-info/40",
                        !done && !active && "bg-secondary text-muted-foreground border-border",
                      )}
                    >
                      {done ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                    </div>
                    <span
                      className={cn(
                        "text-[10px] whitespace-nowrap",
                        active ? "text-foreground font-medium" : "text-muted-foreground",
                      )}
                    >
                      {step.label}
                    </span>
                  </div>
                  {i < lifecycleSteps.length - 1 && (
                    <div className={cn("h-px flex-1 mx-2", done ? "bg-status-success/40" : "bg-border")} />
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="manifest">
        <TabsList>
          <TabsTrigger value="manifest">依赖清单</TabsTrigger>
          <TabsTrigger value="build">组版构建</TabsTrigger>
          <TabsTrigger value="qa">提测与 QA</TabsTrigger>
          <TabsTrigger value="changes">变更记录</TabsTrigger>
        </TabsList>

        {/* 依赖清单 */}
        <TabsContent value="manifest" className="space-y-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <CardTitle className="text-sm">依赖配置清单</CardTitle>
                  <p className="text-xs text-muted-foreground pt-1">
                    共 {detail.resolvedComponents.length} 个组件，其中 {publishedCount} 个已集成新版本，
                    其余回落默认兜底版本
                  </p>
                </div>
                {canFreeze(detail.status) && (
                  <Button size="sm" onClick={() => setAction("freeze")}>
                    <Snowflake className="w-3.5 h-3.5 mr-1.5" />
                    冻结并触发组版构建
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="border border-border rounded-lg divide-y divide-border">
                <div className="flex items-center gap-4 px-4 py-2 text-[11px] font-medium text-muted-foreground bg-secondary/30">
                  <span className="flex-1">组件</span>
                  <span className="w-28">类型</span>
                  <span className="w-24">解析版本</span>
                  <span className="w-32">来源</span>
                  <span className="w-40">集成人 / 时间</span>
                </div>
                {detail.resolvedComponents.map((r) => (
                  <div key={r.component.key} className="flex items-center gap-4 px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/pipelines/${r.component.pipelineId}`}
                        className="text-sm font-medium text-foreground hover:text-status-info inline-flex items-center gap-1"
                      >
                        {r.component.name}
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                      <div className="text-[11px] text-muted-foreground truncate">{r.component.description}</div>
                    </div>
                    <span className="w-28">
                      <Badge variant="secondary" className="text-[10px]">
                        {COMPONENT_TYPE_LABELS[r.component.type]}
                      </Badge>
                    </span>
                    <span className="w-24 font-mono text-sm text-foreground">{r.version}</span>
                    <span className="w-32">
                      {r.source === "published" ? (
                        <Badge className="text-[10px] border-0 bg-[hsl(145,63%,42%)]/10 text-status-success">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          已集成
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px]">
                          默认兜底
                        </Badge>
                      )}
                    </span>
                    <span className="w-40 text-xs text-muted-foreground">
                      {r.publishedBy ? (
                        <>
                          {r.publishedBy}
                          <div className="text-[10px]">{r.publishedAt}</div>
                        </>
                      ) : (
                        "—"
                      )}
                    </span>
                  </div>
                ))}
              </div>
              {editable && (
                <p className="text-[11px] text-muted-foreground pt-3">
                  提示：在「构建记录」或「流水线管理」中对组件的成功构建执行「发布集成」，即可把该组件的新版本写入本清单。
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 组版构建 */}
        <TabsContent value="build" className="space-y-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">组版构建</CardTitle>
            </CardHeader>
            <CardContent>
              {detail.buildId ? (
                <div className="flex items-center justify-between flex-wrap gap-3 p-4 border border-border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-9 h-9 rounded-lg flex items-center justify-center",
                        detail.status === "building"
                          ? "bg-[hsl(199,89%,48%)]/10 text-status-info"
                          : "bg-status-success/10 text-status-success",
                      )}
                    >
                      {detail.status === "building" ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Package className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-foreground">
                        组版构建 #{detail.buildId}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {detail.status === "building" ? "构建进行中…" : "壳子 App 集成全部组件依赖后产出整包"}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/builds/${detail.buildId}`)}
                  >
                    查看构建详情
                    <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                  </Button>
                </div>
              ) : (
                <EmptyState
                  title="尚未触发组版构建"
                  description="在「依赖清单」页确认组件版本后，冻结清单即可触发组版构建"
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 提测与 QA */}
        <TabsContent value="qa" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">提测安装</CardTitle>
                  {canSubmitTest(detail.status) && (
                    <Button size="sm" onClick={() => setAction("test")}>
                      <FlaskConical className="w-3.5 h-3.5 mr-1.5" />
                      提测
                    </Button>
                  )}
                  {canRelease(detail.status) && (
                    <Button
                      size="sm"
                      className="bg-[hsl(145,63%,42%)] hover:bg-[hsl(145,63%,36%)] text-white"
                      onClick={() => setAction("release")}
                    >
                      <Rocket className="w-3.5 h-3.5 mr-1.5" />
                      正式发版
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {submissions && submissions.length > 0 ? (
                  <div className="space-y-4">
                    <p className="text-xs text-muted-foreground">
                      扫码安装最新提测包（{submissions[0].buildVersion}）进行测试
                    </p>
                    <div className="flex gap-6">
                      {submissions[0].qrAndroidUrl && (
                        <div className="flex flex-col items-center gap-2">
                          <div className="p-2 bg-white rounded-lg">
                            <QRCodeSVG value={submissions[0].qrAndroidUrl} size={112} />
                          </div>
                          <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
                            <Smartphone className="w-3 h-3" />
                            Android
                          </span>
                        </div>
                      )}
                      {submissions[0].qrIosUrl && (
                        <div className="flex flex-col items-center gap-2">
                          <div className="p-2 bg-white rounded-lg">
                            <QRCodeSVG value={submissions[0].qrIosUrl} size={112} />
                          </div>
                          <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
                            <Smartphone className="w-3 h-3" />
                            iOS
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <EmptyState
                    title="暂无提测包"
                    description={
                      canSubmitTest(detail.status)
                        ? "构建已成功，点击右上角「提测」生成安装二维码"
                        : "组版构建成功后方可提测"
                    }
                  />
                )}
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">提测历史</CardTitle>
              </CardHeader>
              <CardContent>
                {submissions && submissions.length > 0 ? (
                  <div className="space-y-2">
                    {submissions.map((s) => (
                      <div key={s.id} className="p-3 border border-border rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-mono text-foreground">{s.buildVersion}</span>
                          <Link
                            href={`/builds/${s.buildId}`}
                            className="text-[11px] text-status-info inline-flex items-center gap-1"
                          >
                            构建 #{s.buildId}
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        </div>
                        <div className="text-[11px] text-muted-foreground pt-1">
                          {s.submittedBy} · {s.submittedAt}
                        </div>
                        {s.note && <div className="text-xs text-foreground pt-1">{s.note}</div>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState title="暂无提测记录" description="提测后将在此显示历史清单" />
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 变更记录 */}
        <TabsContent value="changes" className="space-y-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">组件提交变更</CardTitle>
              <p className="text-xs text-muted-foreground pt-1">
                统计各组件距上一次组版成功标签之间的 git 提交记录
              </p>
            </CardHeader>
            <CardContent>
              {changesets && changesets.length > 0 ? (
                <div className="space-y-4">
                  {changesets.map((cs) => (
                    <div key={cs.componentKey} className="border border-border rounded-lg overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-2 bg-secondary/30">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">{cs.componentName}</span>
                          <Badge variant="secondary" className="text-[10px]">
                            {COMPONENT_TYPE_LABELS[cs.componentType]}
                          </Badge>
                          <span className="font-mono text-[11px] text-muted-foreground">{cs.currentVersion}</span>
                        </div>
                        <span className="text-[11px] text-muted-foreground">
                          {cs.sinceTag ? (
                            <>
                              自 <span className="font-mono">{cs.sinceTag}</span> · {cs.commits.length} 次提交
                            </>
                          ) : (
                            `${cs.commits.length} 次提交`
                          )}
                        </span>
                      </div>
                      {cs.commits.length > 0 ? (
                        <div className="divide-y divide-border">
                          {cs.commits.map((c) => (
                            <div key={c.hash} className="flex items-start gap-3 px-4 py-2">
                              <GitCommit className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="text-xs text-foreground">{c.message}</div>
                                <div className="text-[10px] text-muted-foreground">
                                  <span className="font-mono">{c.hash}</span> · {c.author} · {c.date}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="px-4 py-3 text-[11px] text-muted-foreground">距上次组版无新增提交</div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState title="暂无变更记录" description="组件产生新提交后将在此汇总" />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 生命周期操作二次确认 */}
      <AlertDialog open={action !== null} onOpenChange={(o) => !o && setAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {action === "freeze" && `冻结 ${detail.version} 的依赖清单并触发组版构建？`}
              {action === "test" && `提测 ${detail.version}？`}
              {action === "release" && `将 ${detail.version} 正式发版？`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {action === "freeze" &&
                "冻结后依赖配置清单将锁定，不可再修改组件版本，随后自动触发壳子组版构建。"}
              {action === "test" && "将基于组版构建产物生成提测包与扫码安装信息，并记录到提测历史。"}
              {action === "release" &&
                "发版为终态操作，将自动为本次组版打上 git tag，作为下次组版变更统计的基点。"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {action === "test" && (
            <Textarea
              value={testNote}
              onChange={(e) => setTestNote(e.target.value)}
              placeholder="提测说明（可选）"
              className="text-sm min-h-16"
            />
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={running}>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                if (action === "freeze") void runLifecycle("freeze")
                else if (action === "test") void runLifecycle("test")
                else if (action === "release") void runLifecycle("release")
              }}
              disabled={running}
            >
              {running && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              确认
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
