"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import {
  ArrowLeft,
  GitBranch,
  Settings,
  Users,
  Play,
  Clock,
  CheckCircle2,
  XCircle,
  Smartphone,
  Globe,
  Archive,
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import Link from "next/link"
import { useProject, usePipelines } from "@/lib/hooks/use-platform-data"
import { ErrorState, EmptyState, TableSkeleton } from "@/components/ui/data-states"
import { brandLabel, PIPELINE_ENV_LABELS, type Pipeline } from "@/lib/types"

const members = [
  { name: "Zhang Wei", role: "Owner", avatar: "ZW" },
  { name: "Li Na", role: "Developer", avatar: "LN" },
  { name: "Wang Lei", role: "Developer", avatar: "WL" },
  { name: "Chen Xiao", role: "QA", avatar: "CX" },
  { name: "Liu Yang", role: "Release Manager", avatar: "LY" },
  { name: "Zhao Min", role: "Viewer", avatar: "ZM" },
]

const environments = [
  { name: "开发环境", code: "dev", branch: "develop", status: "active" },
  { name: "测试环境", code: "test", branch: "develop", status: "active" },
  { name: "预发环境", code: "stage", branch: "release/*", status: "active" },
  { name: "生产环境", code: "prod", branch: "main", status: "active" },
]

const roleColors: Record<string, string> = {
  Owner: "bg-[hsl(38,92%,50%)]/10 text-status-warning",
  Developer: "bg-[hsl(199,89%,48%)]/10 text-status-info",
  QA: "bg-[hsl(145,63%,49%)]/10 text-status-success",
  "Release Manager": "bg-[hsl(262,52%,55%)]/10 text-status-purple",
  Viewer: "bg-secondary text-muted-foreground",
}

export function ProjectDetailPage({ projectId }: { projectId: string }) {
  const { data: project, isLoading, error, mutate } = useProject(projectId)
  const { data: allPipelines } = usePipelines()

  // 只展示归属当前项目的流水线
  const projectPipelines: Pipeline[] = (allPipelines?.items ?? []).filter(
    (pl) => pl.projectId === projectId,
  )

  if (isLoading) return <TableSkeleton rows={6} columns={4} />
  if (error) return <ErrorState error={error} onRetry={() => void mutate()} />
  if (!project) {
    return (
      <EmptyState
        title="项目不存在"
        description={`未找到 ID 为 ${projectId} 的项目，它可能已被归档或删除。`}
      />
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumb & Header */}
      <div className="flex items-center gap-3">
        <Link href="/projects" className="p-1.5 rounded-md hover:bg-secondary transition-colors" aria-label="返回项目列表">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold text-foreground">{project.name}</h1>
            <Badge variant="outline" className="bg-[hsl(199,89%,48%)]/10 text-status-info border-[hsl(199,89%,48%)]/20 text-xs">{brandLabel(project.brand)}</Badge>
            <Badge variant="secondary" className="text-xs">{project.status === "active" ? "活跃" : "已归档"}</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">{project.desc}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Archive className="w-4 h-4 mr-2" />
            Archive
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Platforms", value: "Android, iOS", icon: Smartphone },
          { label: "Pipelines", value: "4", icon: GitBranch },
          { label: "Members", value: "12", icon: Users },
          { label: "Success Rate", value: "96.5%", icon: CheckCircle2 },
          { label: "Last Build", value: "2 min ago", icon: Clock },
        ].map((s) => (
          <Card key={s.label} className="bg-card border-border">
            <CardContent className="p-3 flex items-center gap-3">
              <s.icon className="w-4 h-4 text-status-info flex-shrink-0" />
              <div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
                <div className="text-sm font-medium text-foreground">{s.value}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pipelines">
        <TabsList className="bg-secondary">
          <TabsTrigger value="pipelines">Pipelines</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="environments">Environments</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="pipelines" className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-foreground">{"\u6D41\u6C34\u7EBF\u5217\u8868"}</h3>
            <Button asChild size="sm" className="bg-[hsl(199,89%,48%)] hover:bg-[hsl(199,89%,42%)] text-white">
              <Link href="/pipelines">
                <GitBranch className="w-4 h-4 mr-2" />
                {"\u65B0\u5EFA\u6D41\u6C34\u7EBF"}
              </Link>
            </Button>
          </div>
          <div className="border border-border rounded-lg divide-y divide-border">
            {projectPipelines.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">{"\u8BE5\u9879\u76EE\u6682\u65E0\u6D41\u6C34\u7EBF"}</div>
            ) : projectPipelines.map((pl) => (
              <div key={pl.id} className="relative flex items-center gap-4 p-4 hover:bg-secondary/30 transition-colors">
                <Link href={`/pipelines/${pl.id}`} className="absolute inset-0 z-0" aria-label={`查看流水线 ${pl.name}`} />
                <div className={`relative z-10 w-2 h-2 rounded-full ${pl.lastStatus === "success" ? "bg-[hsl(145,63%,49%)]" : "bg-[hsl(0,72%,51%)]"}`} />
                <div className="relative z-10 flex-1 min-w-0 pointer-events-none">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-foreground">{pl.name}</span>
                    <Badge variant="outline" className="text-[10px]">{PIPELINE_ENV_LABELS[pl.env]}</Badge>
                    {pl.status === "pending_approval" && <Badge className="text-[10px] bg-[hsl(38,92%,50%)]/10 text-status-warning">{"\u5F85\u5BA1\u6279"}</Badge>}
                  </div>
                  <span className="text-xs text-muted-foreground">{pl.builds} {"\u6B21\u6784\u5EFA / \u6700\u8FD1\u8FD0\u884C\uFF1A"}{pl.lastRun}</span>
                </div>
                <Button asChild size="sm" variant="outline" className="relative z-10">
                  <Link href={`/builds?pipeline=${pl.id}`}>
                    <Play className="w-3 h-3 mr-1" /> {"\u6784\u5EFA\u8BB0\u5F55"}
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="members" className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-foreground">Project Members ({members.length})</h3>
            <Button size="sm" className="bg-[hsl(199,89%,48%)] hover:bg-[hsl(199,89%,42%)] text-white">
              <Users className="w-4 h-4 mr-2" />
              Add Member
            </Button>
          </div>
          <div className="border border-border rounded-lg divide-y divide-border">
            {members.map((m) => (
              <div key={m.name} className="flex items-center gap-4 p-4">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="text-xs bg-[hsl(199,89%,48%)]/20 text-status-info">{m.avatar}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <span className="text-sm font-medium text-foreground">{m.name}</span>
                </div>
                <Badge variant="secondary" className={`text-[10px] ${roleColors[m.role]}`}>{m.role}</Badge>
                <Select defaultValue={m.role}>
                  <SelectTrigger className="w-40 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Owner">Owner</SelectItem>
                    <SelectItem value="Developer">Developer</SelectItem>
                    <SelectItem value="QA">QA</SelectItem>
                    <SelectItem value="Release Manager">Release Manager</SelectItem>
                    <SelectItem value="Viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="environments" className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-foreground">Environments</h3>
            <Button size="sm" className="bg-[hsl(199,89%,48%)] hover:bg-[hsl(199,89%,42%)] text-white">
              Add Environment
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {environments.map((env) => (
              <Card key={env.code} className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-status-info" />
                      <span className="font-medium text-sm text-foreground">{env.name}</span>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-mono">{env.code}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Default Branch: <span className="font-mono text-foreground">{env.branch}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="mt-4 space-y-4">
          <Card className="bg-card border-border">
            <CardHeader><CardTitle className="text-sm">Basic Info</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">Default Branch:</span> <span className="font-mono ml-2">develop</span></div>
                <div><span className="text-muted-foreground">Repository:</span> <span className="font-mono ml-2">git.corp.com/qiyuan-app</span></div>
                <div><span className="text-muted-foreground">Notification:</span> <span className="ml-2">DingTalk Group #qiyuan-dev</span></div>
                <div><span className="text-muted-foreground">Artifact Retention:</span> <span className="ml-2">Last 100 builds</span></div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
