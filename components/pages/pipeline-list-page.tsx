"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
  GitBranch,
  Plus,
  Search,
  Play,
  Clock,
  CheckCircle2,
  XCircle,
  Pause,
  MoreHorizontal,
  PackageCheck,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { usePipelines } from "@/lib/hooks/use-platform-data"
import { ErrorState, EmptyState, TableSkeleton, Pagination } from "@/components/ui/data-states"
import { PIPELINE_ENV_LABELS, type Pipeline } from "@/lib/types"
import { PublishIntegrationDialog } from "@/components/integration/publish-integration-dialog"

const statusIcon: Record<string, React.ReactNode> = {
  success: <CheckCircle2 className="w-4 h-4 text-status-success" />,
  failed: <XCircle className="w-4 h-4 text-status-danger" />,
  running: <div className="w-4 h-4 rounded-full border-2 border-[hsl(199,89%,48%)] border-t-transparent animate-spin" />,
}

const envColors: Record<string, string> = {
  dev: "bg-[hsl(262,52%,55%)]/10 text-[hsl(262,52%,45%)] dark:text-[hsl(262,52%,70%)] border-[hsl(262,52%,55%)]/20",
  staging: "bg-[hsl(199,89%,48%)]/10 text-status-info border-[hsl(199,89%,48%)]/20",
  production: "bg-[hsl(0,72%,51%)]/10 text-status-danger border-[hsl(0,72%,51%)]/20",
}

export function PipelineListPage() {
  const router = useRouter()
  const [keyword, setKeyword] = useState("")
  const [env, setEnv] = useState<string>("all")
  const [page, setPage] = useState(1)
  const [publishTarget, setPublishTarget] = useState<Pipeline | null>(null)
  const { data, error, isLoading, mutate } = usePipelines({
    q: keyword || undefined,
    env: env === "all" ? undefined : env,
    page,
    pageSize: 10,
  })

  function handleKeyword(value: string) {
    setKeyword(value)
    setPage(1)
  }

  function handleEnv(value: string) {
    setEnv(value)
    setPage(1)
  }

  if (isLoading) {
    return <div className="p-6"><TableSkeleton rows={6} columns={5} /></div>
  }
  if (error) {
    return <div className="p-6"><ErrorState error={error} onRetry={() => void mutate()} /></div>
  }

  const pipelines = data?.items ?? []

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">{"\u6D41\u6C34\u7EBF\u7BA1\u7406"}</h1>
          <p className="text-sm text-muted-foreground">{"\u7BA1\u7406\u6240\u6709\u9879\u76EE\u7684 CI/CD \u6D41\u6C34\u7EBF"}</p>
        </div>
        <Button className="bg-[hsl(199,89%,48%)] hover:bg-[hsl(199,89%,42%)] text-white" onClick={() => router.push("/pipelines/new")}>
          <Plus className="w-4 h-4 mr-2" />
          {"\u65B0\u5EFA\u6D41\u6C34\u7EBF"}
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={"\u641C\u7D22\u6D41\u6C34\u7EBF\u540D\u79F0..."}
            className="pl-9"
            value={keyword}
            onChange={(e) => handleKeyword(e.target.value)}
            aria-label={"\u641C\u7D22\u6D41\u6C34\u7EBF"}
          />
        </div>
        <Select value={env} onValueChange={handleEnv}>
          <SelectTrigger className="w-36" aria-label={"\u73AF\u5883\u7B5B\u9009"}><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{"\u5168\u90E8\u73AF\u5883"}</SelectItem>
            {(Object.keys(PIPELINE_ENV_LABELS) as Array<keyof typeof PIPELINE_ENV_LABELS>).map((key) => (
              <SelectItem key={key} value={key}>{PIPELINE_ENV_LABELS[key]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {pipelines.length === 0 ? (
        <EmptyState
          icon={GitBranch}
          title={"\u672A\u627E\u5230\u6D41\u6C34\u7EBF"}
          description={keyword || env !== "all" ? "\u5F53\u524D\u7B5B\u9009\u6761\u4EF6\u4E0B\u6CA1\u6709\u5339\u914D\u7684\u6D41\u6C34\u7EBF\uFF0C\u8BF7\u8C03\u6574\u5173\u952E\u8BCD\u6216\u73AF\u5883\u3002" : "\u8FD8\u6CA1\u6709\u521B\u5EFA\u4EFB\u4F55\u6D41\u6C34\u7EBF\u3002"}
        />
      ) : (
      <div className="border border-border rounded-lg divide-y divide-border">
        {pipelines.map((pl) => (
          <div key={pl.id} className="relative flex items-center gap-4 p-4 hover:bg-secondary/30 transition-colors">
            <Link href={`/pipelines/${pl.id}`} className="absolute inset-0 z-0" aria-label={`${"\u67E5\u770B\u6D41\u6C34\u7EBF "}${pl.name}`} />
            <div className="flex-shrink-0">{statusIcon[pl.lastStatus] || statusIcon.success}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-medium text-sm text-foreground">{pl.name}</span>
                <Badge variant="outline" className={`text-[10px] ${envColors[pl.env] || ""}`}>{PIPELINE_ENV_LABELS[pl.env]}</Badge>
                {pl.status === "pending_approval" && <Badge className="text-[10px] bg-[hsl(38,92%,50%)]/10 text-status-warning border-0">{"\u5F85\u5BA1\u6279"}</Badge>}
                {pl.integration && (
                  <Badge
                    variant="outline"
                    className="text-[10px] gap-1 bg-[hsl(150,60%,40%)]/10 text-[hsl(150,60%,32%)] dark:text-[hsl(150,60%,65%)] border-[hsl(150,60%,40%)]/20"
                  >
                    <PackageCheck className="w-3 h-3" />
                    {"\u53EF\u96C6\u6210\uFF1A"}{pl.integration.componentName}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>{pl.project}</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{pl.lastRun}</span>
                <span>{pl.duration}</span>
                <span>{pl.builds} {"\u6B21\u6784\u5EFA"}</span>
                <span>{pl.successRate}% {"\u6210\u529F\u7387"}</span>
                {pl.integration?.latestVersion && (
                  <span className="font-mono">{"\u6700\u65B0\u4EA7\u7269 "}{pl.integration.latestVersion}</span>
                )}
              </div>
            </div>
            <div className="relative z-10 flex items-center gap-2">
              {pl.integration && (
                <Button
                  size="sm"
                  variant="outline"
                  className="border-[hsl(150,60%,40%)]/30 text-[hsl(150,60%,32%)] dark:text-[hsl(150,60%,65%)] hover:bg-[hsl(150,60%,40%)]/10"
                  disabled={!pl.integration.latestVersion}
                  title={!pl.integration.latestVersion ? "\u6682\u65E0\u6210\u529F\u6784\u5EFA\u4EA7\u7269\u53EF\u53D1\u5E03" : undefined}
                  onClick={() => setPublishTarget(pl)}
                >
                  <PackageCheck className="w-3 h-3 mr-1" /> {"\u53D1\u5E03\u96C6\u6210"}
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={() => router.push(`/builds?pipeline=${pl.id}`)}>
                <Play className="w-3 h-3 mr-1" /> {"\u8FD0\u884C"}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="ghost" onClick={(e) => e.stopPropagation()}>
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => router.push(`/pipelines/${pl.id}`)}>{"\u7F16\u8F91\u6D41\u6C34\u7EBF"}</DropdownMenuItem>
                  <DropdownMenuItem>{"\u514B\u9686\u6D41\u6C34\u7EBF"}</DropdownMenuItem>
                  <DropdownMenuItem>{"\u53E6\u5B58\u4E3A\u6A21\u677F"}</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push(`/builds?pipeline=${pl.id}`)}>{"\u67E5\u770B\u5386\u53F2"}</DropdownMenuItem>
                  <DropdownMenuItem className="text-status-danger">{"\u7981\u7528"}</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}
      </div>
      )}
      {data && data.totalPages > 1 && (
        <div className="rounded-lg border border-border">
          <Pagination
            page={data.page}
            totalPages={data.totalPages}
            total={data.total}
            pageSize={data.pageSize}
            onPageChange={setPage}
          />
        </div>
      )}
      {publishTarget?.integration && (
        <PublishIntegrationDialog
          open={!!publishTarget}
          onOpenChange={(open) => !open && setPublishTarget(null)}
          componentKey={publishTarget.integration.componentKey}
          componentName={publishTarget.integration.componentName}
          defaultVersion={publishTarget.integration.latestVersion}
          buildId={publishTarget.integration.latestBuildId}
        />
      )}
    </div>
  )
}
