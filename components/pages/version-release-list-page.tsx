"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Plus, Layers, ChevronRight, Tag, Shield, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useIntegrationBaselines } from "@/lib/hooks/use-platform-data"
import { BASELINE_STATUS_LABELS } from "@/lib/types"
import type { BaselineStatus } from "@/lib/types"
import { ErrorState, EmptyState, TableSkeleton } from "@/components/ui/data-states"

export const statusBadgeStyle: Record<BaselineStatus, string> = {
  draft: "bg-secondary text-muted-foreground",
  frozen: "bg-[hsl(38,92%,50%)]/10 text-[hsl(38,92%,50%)]",
  building: "bg-[hsl(199,89%,48%)]/10 text-status-info",
  build_success: "bg-[hsl(199,89%,48%)]/10 text-status-info",
  testing: "bg-[hsl(262,83%,58%)]/10 text-[hsl(262,83%,64%)]",
  released: "bg-[hsl(145,63%,42%)]/10 text-status-success",
}

export function VersionReleaseListPage() {
  const router = useRouter()
  const { data, error, isLoading, mutate } = useIntegrationBaselines({ pageSize: 50 })

  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newVersion, setNewVersion] = useState("")
  const [newDescription, setNewDescription] = useState("")
  const [cloneFrom, setCloneFrom] = useState<string>("")

  const baselines = data?.items ?? []

  // 组版版本与默认兜底基线分开呈现：兜底基线仅作回落源，不参与发布流转
  const { versions, fallback } = useMemo(() => {
    const fallback = baselines.find((b) => b.isDefault)
    const versions = baselines.filter((b) => !b.isDefault)
    return { versions, fallback }
  }, [baselines])

  // 默认克隆来源：优先最近一个已发版的基线
  const defaultClone = useMemo(() => {
    const released = baselines.find((b) => b.status === "released")
    return released?.version ?? fallback?.version ?? ""
  }, [baselines, fallback])

  async function handleCreate() {
    if (!newVersion.trim()) {
      toast.error("请填写版本号")
      return
    }
    setCreating(true)
    try {
      const res = await fetch("/api/integration-baselines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          version: newVersion.trim(),
          description: newDescription.trim() || undefined,
          cloneFrom: (cloneFrom || defaultClone) || undefined,
        }),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body?.message ?? "新建版本失败")
      toast.success(`已创建版本 ${body.version}`)
      await mutate()
      router.push(`/integrations/${encodeURIComponent(body.version)}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "新建版本失败，请稍后重试")
    } finally {
      setCreating(false)
    }
  }

  if (isLoading) return <div className="p-6"><TableSkeleton rows={5} columns={4} /></div>
  if (error) return <div className="p-6"><ErrorState error={error} onRetry={() => void mutate()} /></div>

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-semibold text-foreground">版本发布</h1>
          <p className="text-sm text-muted-foreground">
            基于上一基线创建组版版本，集成各组件 SDK 版本、冻结依赖清单、触发组版构建、提测直至正式发版
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setNewVersion("")
            setNewDescription("")
            setCloneFrom(defaultClone)
            setCreateOpen(true)
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          新建版本
        </Button>
      </div>

      {versions.length === 0 ? (
        <EmptyState title="暂无组版版本" description="点击右上角新建版本，将基于上一基线生成依赖配置清单" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {versions.map((b) => (
            <Link key={b.id} href={`/integrations/${encodeURIComponent(b.version)}`}>
              <Card className="bg-card border-border hover:border-[hsl(199,89%,48%)]/50 transition-colors h-full">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-status-info" />
                      <CardTitle className="text-base font-mono">{b.version}</CardTitle>
                    </div>
                    <Badge className={cn("text-[10px] border-0", statusBadgeStyle[b.status])}>
                      {BASELINE_STATUS_LABELS[b.status]}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs text-muted-foreground min-h-8 line-clamp-2">
                    {b.description || "无描述"}
                  </p>
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                    <span>{Object.keys(b.components).length} 个组件已集成</span>
                    {b.previousVersion && (
                      <span className="inline-flex items-center gap-1">
                        <ChevronRight className="w-3 h-3" />
                        基于 <span className="font-mono">{b.previousVersion}</span>
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-border">
                    <span className="text-[11px] text-muted-foreground">
                      {b.createdBy} · {b.createdAt}
                    </span>
                    {b.tag && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-status-success font-mono">
                        <Tag className="w-3 h-3" />
                        {b.tag}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {fallback && (
        <Card className="bg-card border-border border-dashed">
          <CardContent className="flex items-center gap-3 py-4">
            <Shield className="w-4 h-4 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-sm text-foreground">
                默认兜底基线 <span className="font-mono">{fallback.version}</span>
              </div>
              <div className="text-[11px] text-muted-foreground">
                壳子仓库内置的初始化依赖清单，未显式集成的组件回落到此版本
              </div>
            </div>
            <Badge variant="secondary" className="text-[10px]">
              {Object.keys(fallback.components).length} 个组件
            </Badge>
          </CardContent>
        </Card>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>新建组版版本</DialogTitle>
            <DialogDescription>
              将基于所选基线克隆一份完整依赖配置清单作为起点，后续可逐个集成组件的新版本
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="new-version" className="text-xs">
                版本号
              </Label>
              <Input
                id="new-version"
                value={newVersion}
                onChange={(e) => setNewVersion(e.target.value)}
                placeholder="如 V4.0.0"
                className="h-9 font-mono text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-clone-from" className="text-xs">
                基线来源
              </Label>
              <Select value={cloneFrom} onValueChange={setCloneFrom}>
                <SelectTrigger id="new-clone-from" className="h-9 text-sm">
                  <SelectValue placeholder="选择上一基线版本" />
                </SelectTrigger>
                <SelectContent>
                  {baselines.map((b) => (
                    <SelectItem key={b.id} value={b.version}>
                      <span className="font-mono">{b.version}</span>
                      {b.isDefault ? "（默认兜底）" : ` · ${BASELINE_STATUS_LABELS[b.status]}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-description" className="text-xs">
                描述（可选）
              </Label>
              <Input
                id="new-description"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="用于说明本次版本目标"
                className="h-9 text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={creating}>
              取消
            </Button>
            <Button onClick={handleCreate} disabled={creating}>
              {creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              创建
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
