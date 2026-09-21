"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { usePipeline, useIntegrationComponents, useBuilds } from "@/lib/hooks/use-platform-data"
import { ErrorState, TableSkeleton } from "@/components/ui/data-states"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ArrowLeft,
  Plus,
  GripVertical,
  Code,
  TestTube,
  Package,
  ShieldCheck,
  Rocket,
  Trash2,
  Save,
  Play,
  CheckCircle2,
  Settings,
  UploadCloud,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { YamlEditor, validateYaml } from "@/components/pipeline/yaml-editor"
import { PublishIntegrationDialog } from "@/components/integration/publish-integration-dialog"
import { COMPONENT_TYPE_LABELS, PIPELINE_ENV_LABELS } from "@/lib/types"

const stages = [
  { id: "lint", name: "代码检查", icon: Code, type: "Lint", enabled: true, tasks: ["ESLint", "Android Lint", "依赖检查"] },
  { id: "test", name: "单元测试", icon: TestTube, type: "Test", enabled: true, tasks: ["Jest", "JUnit", "覆盖率报告"] },
  { id: "build", name: "构建打包", icon: Package, type: "Build", enabled: true, tasks: ["Android APK", "iOS IPA", "代码混淆"] },
  { id: "quality", name: "质量门禁", icon: ShieldCheck, type: "Quality", enabled: true, tasks: ["包体积检查", "启动速度", "安全扫描"] },
  { id: "deploy", name: "部署发布", icon: Rocket, type: "Deploy", enabled: true, tasks: ["上传蒲公英", "生成二维码", "发送通知"] },
]

const stageColors: Record<string, string> = {
  Lint: "border-[hsl(38,92%,50%)]/30 bg-[hsl(38,92%,50%)]/5",
  Test: "border-[hsl(199,89%,48%)]/30 bg-[hsl(199,89%,48%)]/5",
  Build: "border-[hsl(145,63%,49%)]/30 bg-[hsl(145,63%,49%)]/5",
  Quality: "border-[hsl(262,52%,55%)]/30 bg-[hsl(262,52%,55%)]/5",
  Deploy: "border-[hsl(0,72%,51%)]/30 bg-[hsl(0,72%,51%)]/5",
}

const stageIconColors: Record<string, string> = {
  Lint: "text-status-warning",
  Test: "text-status-info",
  Build: "text-status-success",
  Quality: "text-status-purple",
  Deploy: "text-status-danger",
}

const typeLabels: Record<string, string> = {
  Lint: "代码检查",
  Test: "测试",
  Build: "构建",
  Quality: "质量",
  Deploy: "部署",
}

const INITIAL_YAML = `pipeline:
  name: qiyuan-test-pipeline
  project: qiyuan-app
  environment: test
  trigger:
    - push:
        branches: [develop, feature/*]
    - schedule:
        cron: "0 2 * * *"

stages:
  - name: 代码检查
    type: lint
    tasks:
      - name: ESLint
        script: npm run lint
        timeout: 300
      - name: Android Lint
        script: ./gradlew lint
      - name: 依赖检查
        script: npm audit --production

  - name: 单元测试
    type: test
    tasks:
      - name: Jest
        script: npm test -- --coverage
      - name: JUnit
        script: ./gradlew test

  - name: 构建打包
    type: build
    tasks:
      - name: Android APK
        script: ./gradlew assembleRelease
      - name: iOS IPA
        script: xcodebuild archive

  - name: 质量门禁
    type: quality
    rules:
      package_size:
        warning: "+8%"
        error: "+15%"
      startup_time:
        warning: "+10%"
        error: "+20%"

  - name: 部署发布
    type: deploy
    tasks:
      - name: 上传蒲公英
        script: ./scripts/upload-pgyer.sh
`

export function PipelineEditorPage({ pipelineId }: { pipelineId: string }) {
  const router = useRouter()
  const { data: pipeline, error, isLoading, mutate } = usePipeline(pipelineId)
  const { data: integrationComponents } = useIntegrationComponents()

  const [selectedStage, setSelectedStage] = useState("lint")
  const [yamlDraft, setYamlDraft] = useState(INITIAL_YAML)
  const [yamlSaved, setYamlSaved] = useState(INITIAL_YAML)
  const [publishOpen, setPublishOpen] = useState(false)

  const integrationComponent = integrationComponents?.find((c) => c.key === pipeline?.componentKey)
  const { data: recentBuilds } = useBuilds(
    integrationComponent ? { pipelineId, status: "success", pageSize: 1 } : {},
  )
  const latestSuccessVersion = integrationComponent ? recentBuilds?.items[0]?.version : undefined

  // 校验结果在页面层计算，供顶部「保存」与编辑器共用同一判断标准
  const yamlIssues = useMemo(() => validateYaml(yamlDraft), [yamlDraft])
  const yamlErrorCount = yamlIssues.filter((i) => i.severity === "error").length
  const yamlDirty = yamlDraft !== yamlSaved
  const canSave = yamlDirty && yamlErrorCount === 0

  const saveHint = yamlErrorCount > 0
    ? "YAML 存在语法错误，无法保存"
    : yamlDirty
      ? "保存流水线配置"
      : "没有待保存的更改"

  const current = stages.find((s) => s.id === selectedStage)

  if (isLoading) return <TableSkeleton rows={6} columns={4} />
  if (error) {
    return (
      <ErrorState
        title={"\u52A0\u8F7D\u6D41\u6C34\u7EBF\u5931\u8D25"}
        error={error}
        onRetry={() => void mutate()}
      />
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* 页头 */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/pipelines")}
          aria-label="返回流水线列表"
          className="p-1.5 rounded-md hover:bg-secondary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-semibold text-foreground">{pipeline?.name}</h1>
          <p className="text-sm text-muted-foreground">
            {pipeline?.project} · {PIPELINE_ENV_LABELS[pipeline?.env ?? "test"]}环境 · 可视化编辑
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setYamlSaved(yamlDraft)}
            disabled={!canSave}
            title={saveHint}
            className="relative"
          >
            <Save className="w-4 h-4 mr-2" />
            保存
            {yamlDirty && (
              <span
                aria-hidden="true"
                className={cn(
                  "absolute -top-1 -right-1 w-2 h-2 rounded-full ring-2 ring-background",
                  yamlErrorCount > 0 ? "bg-status-danger" : "bg-status-warning"
                )}
              />
            )}
          </Button>
          <Button variant="outline" size="sm">
            另存为模板
          </Button>
          <Button
            size="sm"
            className="bg-[hsl(199,89%,48%)] hover:bg-[hsl(199,89%,42%)] text-white"
            onClick={() => router.push(`/builds?pipeline=${encodeURIComponent(pipelineId)}`)}
          >
            <Play className="w-4 h-4 mr-2" />
            运行流水线
          </Button>
        </div>
      </div>

      {integrationComponent && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-[hsl(199,89%,48%)]/30 bg-[hsl(199,89%,48%)]/5 px-4 py-2.5">
          <div className="text-sm text-foreground">
            集成组件：<span className="font-medium">{integrationComponent.name}</span>
            <Badge variant="secondary" className="ml-2 text-[10px]">
              {COMPONENT_TYPE_LABELS[integrationComponent.type]}
            </Badge>
          </div>
          <Button size="sm" variant="outline" onClick={() => setPublishOpen(true)}>
            <UploadCloud className="w-3.5 h-3.5 mr-1.5" />
            发布集成
          </Button>
        </div>
      )}

      <Tabs defaultValue="visual">
        <TabsList className="bg-secondary">
          <TabsTrigger value="visual">可视化编辑</TabsTrigger>
          <TabsTrigger value="yaml" className="gap-1.5">
            YAML 编辑
            {yamlDirty && (
              <span
                aria-hidden="true"
                className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  yamlErrorCount > 0 ? "bg-status-danger" : "bg-status-warning"
                )}
              />
            )}
          </TabsTrigger>
          <TabsTrigger value="config">基础配置</TabsTrigger>
          <TabsTrigger value="variables">环境变量</TabsTrigger>
          <TabsTrigger value="history">版本历史</TabsTrigger>
        </TabsList>

        <TabsContent value="visual" className="mt-4 space-y-6">
          {/* 阶段流程 */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">流水线阶段</CardTitle>
                <Button size="sm" variant="outline">
                  <Plus className="w-3 h-3 mr-1" />
                  添加阶段
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center overflow-x-auto pb-4 px-2">
                {stages.map((stage, i) => (
                  <div key={stage.id} className="flex items-center flex-shrink-0">
                    <button
                      onClick={() => setSelectedStage(stage.id)}
                      className={cn(
                        "relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all min-w-[130px]",
                        stageColors[stage.type],
                        selectedStage === stage.id
                          ? "ring-2 ring-[hsl(199,89%,48%)] ring-offset-2 ring-offset-card scale-105 shadow-lg"
                          : "hover:scale-[1.02] hover:shadow-md"
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
                        selectedStage === stage.id ? "bg-[hsl(199,89%,48%)]/10" : "bg-background/50"
                      )}>
                        <stage.icon className={cn("w-5 h-5", stageIconColors[stage.type])} />
                      </div>
                      <span className="text-xs font-medium text-foreground">{stage.name}</span>
                      <Badge variant="secondary" className="text-[9px]">{stage.tasks.length} 个任务</Badge>
                      {!stage.enabled && (
                        <div className="absolute inset-0 bg-background/60 rounded-xl flex items-center justify-center backdrop-blur-[1px]">
                          <span className="text-xs text-muted-foreground">已禁用</span>
                        </div>
                      )}
                    </button>
                    {i < stages.length - 1 && (
                      <div className="flex items-center mx-1 flex-shrink-0">
                        <div className="w-6 h-[2px] bg-gradient-to-r from-muted-foreground/40 to-muted-foreground/20" />
                        <div className="w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-l-[6px] border-l-muted-foreground/40" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 阶段详情 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">阶段：{current?.name}</CardTitle>
                  <Switch defaultChecked />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label className="text-xs">阶段名称</Label>
                  <Input key={selectedStage} defaultValue={current?.name} className="h-8 text-sm" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">阶段类型</Label>
                  <Select key={selectedStage} defaultValue={current?.type}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(typeLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">执行条件</Label>
                  <Select defaultValue="always">
                    <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="always">始终执行</SelectItem>
                      <SelectItem value="prev_success">上一阶段成功时</SelectItem>
                      <SelectItem value="branch_match">分支匹配时</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">失败策略</Label>
                  <Select defaultValue="fail_fast">
                    <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fail_fast">快速失败</SelectItem>
                      <SelectItem value="continue">出错后继续</SelectItem>
                      <SelectItem value="retry">自动重试（最多 3 次）</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">任务列表</CardTitle>
                  <Button size="sm" variant="outline">
                    <Plus className="w-3 h-3 mr-1" />
                    添加任务
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {current?.tasks.map((task) => (
                  <div key={task} className="flex items-center gap-2 p-2.5 rounded-md border border-border bg-secondary/30 group">
                    <GripVertical className="w-3 h-3 text-muted-foreground cursor-grab" />
                    <CheckCircle2 className="w-3.5 h-3.5 text-status-success" />
                    <span className="text-sm text-foreground flex-1">{task}</span>
                    <Badge variant="secondary" className="text-[9px]">Shell</Badge>
                    <button aria-label={`配置 ${task}`} className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <Settings className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                    </button>
                    <button aria-label={`删除 ${task}`} className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-status-danger" />
                    </button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="yaml" className="mt-4">
          <YamlEditor
            value={yamlDraft}
            issues={yamlIssues}
            onChange={setYamlDraft}
            onSave={() => setYamlSaved(yamlDraft)}
            onReset={() => setYamlDraft(yamlSaved)}
            dirty={yamlDirty}
          />
        </TabsContent>

        <TabsContent value="config" className="mt-4 space-y-4">
          <Card className="bg-card border-border">
            <CardHeader><CardTitle className="text-sm">基础配置</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>流水线名称</Label>
                  <Input defaultValue="启源测试流水线" />
                </div>
                <div className="space-y-2">
                  <Label>运行环境</Label>
                  <Select defaultValue="test">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="test">测试环境</SelectItem>
                      <SelectItem value="prod">生产环境</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>默认分支</Label>
                  <Input defaultValue="develop" />
                </div>
                <div className="space-y-2">
                  <Label>触发方式</Label>
                  <Select defaultValue="push">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="push">代码推送</SelectItem>
                      <SelectItem value="manual">手动触发</SelectItem>
                      <SelectItem value="schedule">定时触发</SelectItem>
                      <SelectItem value="webhook">Webhook</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="variables" className="mt-4 space-y-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">环境变量</CardTitle>
                <Button size="sm" variant="outline"><Plus className="w-3 h-3 mr-1" />添加变量</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="border border-border rounded-lg divide-y divide-border">
                {[
                  { key: "NODE_ENV", value: "production", secret: false },
                  { key: "BUILD_TYPE", value: "release", secret: false },
                  { key: "SIGNING_KEY", value: "********", secret: true },
                  { key: "API_BASE_URL", value: "https://api.test.corp.com", secret: false },
                ].map((v) => (
                  <div key={v.key} className="flex items-center gap-4 p-3">
                    <span className="font-mono text-sm text-foreground w-40">{v.key}</span>
                    <span className="font-mono text-sm text-muted-foreground flex-1 truncate">{v.value}</span>
                    {v.secret && <Badge variant="secondary" className="text-[10px]">密文</Badge>}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <Card className="bg-card border-border">
            <CardHeader><CardTitle className="text-sm">版本历史</CardTitle></CardHeader>
            <CardContent>
              <div className="border border-border rounded-lg divide-y divide-border">
                {[
                  { ver: "v3", user: "张伟", time: "2 小时前", summary: "在质量门禁阶段新增安全扫描任务" },
                  { ver: "v2", user: "李娜", time: "昨天", summary: "更新构建脚本以支持 Android 14" },
                  { ver: "v1", user: "张伟", time: "3 天前", summary: "初始化流水线配置" },
                ].map((v) => (
                  <div key={v.ver} className="flex items-center gap-4 p-3">
                    <Badge variant="outline" className="font-mono text-xs">{v.ver}</Badge>
                    <div className="flex-1">
                      <span className="text-sm text-foreground">{v.summary}</span>
                      <div className="text-xs text-muted-foreground mt-0.5">{v.user} · {v.time}</div>
                    </div>
                    <Button size="sm" variant="ghost" className="text-xs">回滚</Button>
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
          defaultVersion={latestSuccessVersion}
        />
      )}
    </div>
  )
}
