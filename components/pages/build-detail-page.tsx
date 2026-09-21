"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  RefreshCw,
  GitBranch,
  Code,
  TestTube,
  Package,
  ShieldCheck,
  Rocket,
  FileText,
  QrCode,
  Copy,
  ExternalLink,
  AlertTriangle,
  User,
  Calendar,
  Timer,
  ChevronDown,
  ChevronRight,
  UploadCloud,
} from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { useBuild, useIntegrationComponents } from "@/lib/hooks/use-platform-data"
import { ErrorState, EmptyState, TableSkeleton } from "@/components/ui/data-states"
import { BUILD_STATUS_LABELS } from "@/lib/types"
import { PublishIntegrationDialog } from "@/components/integration/publish-integration-dialog"

const stageSteps = [
  {
    name: "Code Check",
    icon: Code,
    status: "success",
    duration: "45s",
    startTime: "14:25:31",
    endTime: "14:26:10",
    tasks: [
      { name: "ESLint", status: "success", duration: "20s", detail: "0 errors, 2 warnings" },
      { name: "Android Lint", status: "success", duration: "18s", detail: "0 errors, 5 warnings" },
      { name: "Dep Check", status: "success", duration: "7s", detail: "No vulnerabilities" },
    ],
  },
  {
    name: "Unit Test",
    icon: TestTube,
    status: "success",
    duration: "1m 28s",
    startTime: "14:26:11",
    endTime: "14:27:40",
    tasks: [
      { name: "Jest (142 tests)", status: "success", duration: "52s", detail: "Coverage: 82.3%" },
      { name: "JUnit (86 tests)", status: "success", duration: "36s", detail: "All passed" },
    ],
  },
  {
    name: "Build",
    icon: Package,
    status: "success",
    duration: "3m 45s",
    startTime: "14:27:41",
    endTime: "14:31:27",
    tasks: [
      { name: "Android APK", status: "success", duration: "2m 10s", detail: "38.2 MB" },
      { name: "iOS IPA", status: "success", duration: "1m 35s", detail: "42.1 MB" },
    ],
  },
  {
    name: "Quality Gate",
    icon: ShieldCheck,
    status: "warning",
    duration: "32s",
    startTime: "14:31:28",
    endTime: "14:32:02",
    tasks: [
      { name: "Package Size", status: "warning", duration: "12s", detail: "+6.1% (38.2MB)" },
      { name: "Startup Speed", status: "success", duration: "10s", detail: "1.8s (OK)" },
      { name: "Security Scan", status: "success", duration: "10s", detail: "No critical issues" },
    ],
  },
  {
    name: "Deploy",
    icon: Rocket,
    status: "success",
    duration: "22s",
    startTime: "14:32:03",
    endTime: "14:32:25",
    tasks: [
      { name: "Upload Pgyer", status: "success", duration: "15s", detail: "QR generated" },
      { name: "Notification", status: "success", duration: "7s", detail: "DingTalk sent" },
    ],
  },
]

const statusStyles: Record<string, { bg: string; text: string; ring: string }> = {
  success: { bg: "bg-brand-success/10", text: "text-status-success", ring: "ring-brand-success/20" },
  failed: { bg: "bg-brand-danger/10", text: "text-status-danger", ring: "ring-brand-danger/20" },
  warning: { bg: "bg-brand-warning/10", text: "text-status-warning", ring: "ring-brand-warning/20" },
  running: { bg: "bg-brand-info/10", text: "text-status-info", ring: "ring-brand-info/20" },
}

const taskDot: Record<string, string> = {
  success: "bg-brand-success",
  warning: "bg-brand-warning",
  failed: "bg-brand-danger",
}

const artifacts = [
  { name: "qiyuan-v2.3-release.apk", type: "APK", size: "38.2 MB", icon: "android" },
  { name: "qiyuan-v2.3-release.ipa", type: "IPA", size: "42.1 MB", icon: "ios" },
  { name: "mapping.txt", type: "ProGuard Map", size: "2.4 MB", icon: "file" },
  { name: "test-report.html", type: "Test Report", size: "156 KB", icon: "report" },
  { name: "coverage-report.html", type: "Coverage", size: "234 KB", icon: "report" },
  { name: "manifest.json", type: "Manifest", size: "4 KB", icon: "file" },
]

const BUILD_STATUS_ICON: Record<string, typeof CheckCircle2> = {
  success: CheckCircle2,
  failed: XCircle,
  running: RefreshCw,
  cancelled: XCircle,
  pending: Clock,
}

// 阶段类型 → 图标，与平台的 6 种阶段类型对齐
const STAGE_TYPE_ICON: Record<string, typeof Package> = {
  lint: Code,
  test: TestTube,
  build: Package,
  "quality-gate": ShieldCheck,
  deploy: Rocket,
  notify: FileText,
}

export function BuildDetailPage({ buildId }: { buildId: string }) {
  const [expandedStage, setExpandedStage] = useState<string | null>("quality")
  const [publishOpen, setPublishOpen] = useState(false)
  const { data: build, isLoading, error, mutate } = useBuild(buildId)
  const { data: integrationComponents } = useIntegrationComponents()
  const integrationComponent = integrationComponents?.find((c) => c.key === build?.componentKey)

  if (isLoading) return <TableSkeleton rows={6} columns={4} />
  if (error) return <ErrorState error={error} onRetry={() => void mutate()} />
  if (!build) {
    return (
      <EmptyState
        title="构建记录不存在"
        description={`未找到 ID 为 ${buildId} 的构建记录，它可能已被清理。`}
      />
    )
  }

  const StatusIcon = BUILD_STATUS_ICON[build.status] ?? CheckCircle2
  const statusStyle = statusStyles[build.status] ?? statusStyles.success

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/builds" className="p-1.5 rounded-md hover:bg-secondary transition-colors" aria-label="返回构建记录">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold text-foreground">{"\u6784\u5EFA #"}{build.number}</h1>
            <Badge variant="outline" className={cn("gap-1", statusStyle.bg, statusStyle.text, statusStyle.ring)}>
              <StatusIcon className="w-3 h-3" /> {BUILD_STATUS_LABELS[build.status]}
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1.5 flex-wrap">
            <span className="flex items-center gap-1"><Package className="w-3 h-3" />{build.project}</span>
            <span className="flex items-center gap-1"><GitBranch className="w-3 h-3" /><code>{build.branch}</code></span>
            <span className="flex items-center gap-1"><Code className="w-3 h-3" /><code>{build.commit}</code></span>
            <span className="flex items-center gap-1"><Timer className="w-3 h-3" />{build.duration}</span>
            <span className="flex items-center gap-1"><User className="w-3 h-3" />{build.user}</span>
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{build.time}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" /> 重新构建
          </Button>
          <Button variant="outline" size="sm">
            <Copy className="w-4 h-4 mr-2" /> 复制日志
          </Button>
          {integrationComponent && build.status === "success" && (
            <Button variant="outline" size="sm" onClick={() => setPublishOpen(true)}>
              <UploadCloud className="w-4 h-4 mr-2" /> 发布集成
            </Button>
          )}
          <Button size="sm" className="bg-[hsl(199,89%,48%)] hover:bg-[hsl(199,89%,42%)] text-white">
            <Download className="w-4 h-4 mr-2" /> 下载
          </Button>
        </div>
      </div>

      {/* Stage Progress - Horizontal Flow */}
      <Card className="bg-card border-border overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-center gap-0 relative">
            {build.stages.map((stage, i) => {
              const ss = statusStyles[stage.status] ?? statusStyles.success
              const StageIcon = STAGE_TYPE_ICON[stage.type] ?? Package
              return (
                <div key={stage.name} className="flex items-center flex-1 min-w-0 relative">
                  <button
                    className="flex flex-col items-center gap-1.5 w-full group"
                    onClick={() => setExpandedStage(expandedStage === stage.name ? null : stage.name)}
                    aria-expanded={expandedStage === stage.name}
                  >
                    <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center ring-2 transition-all", ss.bg, ss.ring, "group-hover:scale-110")}>
                      <StageIcon className={cn("w-5 h-5", ss.text)} />
                    </div>
                    <span className="text-[11px] font-medium text-foreground text-center leading-tight">{stage.name}</span>
                    <span className="text-[10px] text-muted-foreground">{stage.duration}</span>
                  </button>
                  {i < build.stages.length - 1 && (
                    <div className="absolute top-5 left-[calc(50%+24px)] right-[calc(-50%+24px)] h-[2px] bg-border z-0" />
                  )}
                </div>
              )
            })}
          </div>

          {/* Expandable stage logs */}
          {build.stages.map((stage) => {
            if (expandedStage !== stage.name) return null
            const StageIcon = STAGE_TYPE_ICON[stage.type] ?? Package
            const ss = statusStyles[stage.status] ?? statusStyles.success
            return (
              <div key={stage.name} className="mt-4 pt-4 border-t border-border">
                <div className="flex items-center gap-2 mb-3">
                  <StageIcon className={cn("w-4 h-4", ss.text)} />
                  <span className="text-sm font-medium text-foreground">{stage.name}</span>
                  <Badge variant="outline" className={cn("text-[10px]", ss.bg, ss.text)}>
                    {BUILD_STATUS_LABELS[stage.status]}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{"\u8017\u65F6 "}{stage.duration}</span>
                </div>
                {stage.logs && stage.logs.length > 0 ? (
                  <div className="rounded-lg bg-secondary/30 border border-border/50 p-3 space-y-1 font-mono text-[11px] leading-relaxed">
                    {stage.logs.map((line, idx) => (
                      <div key={idx} className="text-foreground/75">{line}</div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground p-3">{"\u8BE5\u9636\u6BB5\u6682\u65E0\u65E5\u5FD7\u8BB0\u5F55"}</div>
                )}
              </div>
            )
          })}
        </CardContent>
      </Card>

      <Tabs defaultValue="logs">
        <TabsList className="bg-secondary">
          <TabsTrigger value="logs">{"\u6784\u5EFA\u65E5\u5FD7"}</TabsTrigger>
          <TabsTrigger value="artifacts">{"\u4EA7\u7269"} ({build.artifactList.length})</TabsTrigger>
          <TabsTrigger value="quality">{"\u8D28\u91CF\u62A5\u544A"}</TabsTrigger>
          <TabsTrigger value="config">{"\u6784\u5EFA\u914D\u7F6E"}</TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="mt-4">
          <Card className="bg-card border-border">
            <CardContent className="p-0">
              <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-secondary/30">
                <span className="text-xs text-muted-foreground">完整构建输出</span>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="h-6 text-[10px]"><Copy className="w-3 h-3 mr-1" />复制</Button>
                  <Button variant="ghost" size="sm" className="h-6 text-[10px]"><Download className="w-3 h-3 mr-1" />导出</Button>
                </div>
              </div>
              <pre className="p-4 text-[11px] font-mono text-foreground/75 overflow-auto max-h-[400px] leading-5 selection:bg-brand-info/20">
{`[14:25:30] Starting pipeline: qiyuan-test-pipeline
[14:25:30] Branch: release/v2.3 | Commit: a1b2c3d4e5f6g7h8
[14:25:30] Trigger: Manual by Zhang Wei

`}<span className="text-status-info">{`[14:25:31] ========== Stage 1/5: Code Check ==========`}</span>{`
[14:25:31] [ESLint] Running ESLint check...
[14:25:45] [ESLint] `}<span className="text-status-success">{"OK"}</span>{` No errors, 2 warnings
[14:25:46] [Android Lint] Running Android Lint...
[14:26:02] [Android Lint] `}<span className="text-status-success">{"OK"}</span>{` 0 errors, 5 warnings
[14:26:03] [Dep Check] Checking dependencies...
[14:26:10] [Dep Check] `}<span className="text-status-success">{"OK"}</span>{` No vulnerabilities found
[14:26:10] `}<span className="text-status-success">{"[PASS]"}</span>{` Stage: Code Check completed (45s)

`}<span className="text-status-info">{`[14:26:11] ========== Stage 2/5: Unit Test ==========`}</span>{`
[14:26:11] [Jest] Running 142 test suites...
[14:27:03] [Jest] `}<span className="text-status-success">{"OK"}</span>{` 142 passed, 0 failed (coverage: 82.3%)
[14:27:04] [JUnit] Running 86 test cases...
[14:27:40] [JUnit] `}<span className="text-status-success">{"OK"}</span>{` 86 passed, 0 failed
[14:27:40] `}<span className="text-status-success">{"[PASS]"}</span>{` Stage: Unit Test completed (1m 28s)

`}<span className="text-status-info">{`[14:27:41] ========== Stage 3/5: Build ==========`}</span>{`
[14:27:41] [Android] ./gradlew assembleRelease
[14:29:51] [Android] `}<span className="text-status-success">{"OK"}</span>{` APK generated: 38.2 MB
[14:29:52] [iOS] xcodebuild -workspace QiyuanApp.xcworkspace
[14:31:27] [iOS] `}<span className="text-status-success">{"OK"}</span>{` IPA generated: 42.1 MB
[14:31:27] `}<span className="text-status-success">{"[PASS]"}</span>{` Stage: Build completed (3m 45s)

`}<span className="text-status-info">{`[14:31:28] ========== Stage 4/5: Quality Gate ==========`}</span>{`
[14:31:28] [Package Size] Checking size delta...
[14:31:40] [Package Size] `}<span className="text-status-warning">{"WARN"}</span>{` APK: 38.2MB (baseline: 36MB, +6.1%)
[14:31:41] [Startup Speed] Testing cold start...
[14:31:51] [Startup Speed] `}<span className="text-status-success">{"OK"}</span>{` Cold: 1.8s (baseline: 2.0s)
[14:31:52] [Security Scan] Running scan...
[14:32:02] [Security Scan] `}<span className="text-status-success">{"OK"}</span>{` No critical issues
[14:32:02] `}<span className="text-status-warning">{"[WARN]"}</span>{` Stage: Quality Gate completed with warnings (32s)

`}<span className="text-status-info">{`[14:32:03] ========== Stage 5/5: Deploy ==========`}</span>{`
[14:32:03] [Pgyer] Uploading APK to Pgyer...
[14:32:18] [Pgyer] `}<span className="text-status-success">{"OK"}</span>{` Upload complete
[14:32:19] [Notify] Sending DingTalk notification...
[14:32:25] [Notify] `}<span className="text-status-success">{"OK"}</span>{` Notification sent
[14:32:25] `}<span className="text-status-success">{"[PASS]"}</span>{` Stage: Deploy completed (22s)

`}<span className="text-status-success font-semibold">{`[14:32:25] Pipeline completed successfully (6m 32s)`}</span>
              </pre>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="artifacts" className="mt-4 space-y-4">
          {/* QR Code Section */}
          <Card className="bg-card border-border">
            <CardContent className="p-5">
              <div className="flex items-start gap-8">
                <div className="flex flex-col items-center gap-2.5">
                  <div className="w-32 h-32 rounded-xl bg-background border-2 border-dashed border-border flex items-center justify-center">
                    <QrCode className="w-16 h-16 text-muted-foreground/40" />
                  </div>
                  <Badge variant="secondary" className="text-[10px] bg-[hsl(145,63%,42%)]/10 text-status-success">Android APK</Badge>
                </div>
                <div className="flex flex-col items-center gap-2.5">
                  <div className="w-32 h-32 rounded-xl bg-background border-2 border-dashed border-border flex items-center justify-center">
                    <QrCode className="w-16 h-16 text-muted-foreground/40" />
                  </div>
                  <Badge variant="secondary" className="text-[10px] bg-[hsl(199,89%,48%)]/10 text-status-info">iOS IPA</Badge>
                </div>
                <div className="flex-1 space-y-3 pt-2">
                  <div>
                    <div className="text-sm font-medium text-foreground">扫码安装</div>
                    <div className="text-xs text-muted-foreground mt-1">使用手机摄像头扫描二维码以安装测试构建。</div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-2.5 rounded-md bg-secondary/30">
                      <span className="text-muted-foreground">版本</span>
                      <div className="font-mono font-medium text-foreground mt-0.5">v2.3.0 (1284)</div>
                    </div>
                    <div className="p-2.5 rounded-md bg-secondary/30">
                      <span className="text-muted-foreground">有效期</span>
                      <div className="font-medium text-foreground mt-0.5">7 天</div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="text-xs">
                    <ExternalLink className="w-3 h-3 mr-1.5" /> 打开安装页
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Artifact List */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{"\u6784\u5EFA\u4EA7\u7269"}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {build.artifactList.length === 0 ? (
                  <div className="p-8 text-center text-sm text-muted-foreground">{"\u672C\u6B21\u6784\u5EFA\u672A\u751F\u6210\u4EA7\u7269"}</div>
                ) : build.artifactList.map((a) => (
                  <div key={a.name} className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/20 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-mono text-foreground block truncate">{a.name}</span>
                      <span className="text-[10px] text-muted-foreground">{a.type}</span>
                    </div>
                    <span className="text-xs text-muted-foreground w-20 text-right">{a.size}</span>
                    <Button size="sm" variant="ghost" className="h-7" aria-label={`下载 ${a.name}`}>
                      <Download className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quality" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-card border-border border-l-2 border-l-[hsl(38,92%,50%)]">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">安装包大小</CardTitle>
                  <AlertTriangle className="w-4 h-4 text-status-warning" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground tracking-tight">38.2 <span className="text-base font-normal text-muted-foreground">MB</span></div>
                <div className="flex items-center gap-2 text-xs mt-2">
                  <Badge className="bg-[hsl(38,92%,50%)]/10 text-status-warning border-0 text-[10px]">+6.1%</Badge>
                  <span className="text-muted-foreground">相较基线 (36 MB)</span>
                </div>
                <div className="mt-3">
                  <div className="h-2 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-[hsl(145,63%,49%)] via-[hsl(38,92%,50%)] to-[hsl(0,72%,51%)]" style={{ width: "76%" }} />
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                    <span>正常</span><span className="text-status-warning">警告：+8%</span><span>错误：+15%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border border-l-2 border-l-[hsl(145,63%,49%)]">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">启动速度</CardTitle>
                  <CheckCircle2 className="w-4 h-4 text-status-success" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground tracking-tight">1.8 <span className="text-base font-normal text-muted-foreground">秒</span></div>
                <div className="flex items-center gap-2 text-xs mt-2">
                  <Badge className="bg-[hsl(145,63%,42%)]/10 text-status-success border-0 text-[10px]">-10%</Badge>
                  <span className="text-muted-foreground">相较基线 (2.0秒)</span>
                </div>
                <Progress value={45} className="mt-3 h-2" />
              </CardContent>
            </Card>
            <Card className="bg-card border-border border-l-2 border-l-[hsl(145,63%,49%)]">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">安全扫描</CardTitle>
                  <CheckCircle2 className="w-4 h-4 text-status-success" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-status-success tracking-tight">通过</div>
                <div className="text-xs text-muted-foreground mt-2">严重 0 · 高危 0 · 中危 2 · 低危 5</div>
                <div className="flex gap-1 mt-3">
                  <div className="h-2 flex-[0] rounded-l-full bg-[hsl(0,72%,51%)]" />
                  <div className="h-2 flex-[0] bg-[hsl(38,92%,50%)]" />
                  <div className="h-2 flex-[2] bg-[hsl(38,92%,50%)]/50" />
                  <div className="h-2 flex-[5] bg-[hsl(145,63%,49%)]/30" />
                  <div className="h-2 flex-[93] rounded-r-full bg-[hsl(145,63%,49%)]" />
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                  <span>严重：0</span><span>高危：0</span><span>中危：2</span><span>低危：5</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="config" className="mt-4">
          <Card className="bg-card border-border">
            <CardContent className="pt-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                {[
                  { label: "Pipeline", value: "Qiyuan Test Pipeline" },
                  { label: "Branch", value: "release/v2.3", mono: true },
                  { label: "Commit", value: "a1b2c3d4e5f6g7h8", mono: true },
                  { label: "Trigger", value: "Manual by Zhang Wei" },
                  { label: "Build Type", value: "Release" },
                  { label: "Environment", value: "test" },
                  { label: "Build Note", value: "Release v2.3 candidate build" },
                  { label: "Node Version", value: "v18.19.0", mono: true },
                ].map((item) => (
                  <div key={item.label} className="flex items-baseline gap-3">
                    <span className="text-xs text-muted-foreground w-24 flex-shrink-0">{item.label}</span>
                    <span className={cn("text-sm text-foreground", item.mono && "font-mono")}>{item.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {integrationComponent && (
        <PublishIntegrationDialog
          open={publishOpen}
          onOpenChange={setPublishOpen}
          componentKey={integrationComponent.key}
          componentName={integrationComponent.name}
          defaultVersion={build.version}
          buildId={build.id}
        />
      )}
    </div>
  )
}
