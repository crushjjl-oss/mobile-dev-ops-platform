"use client"

import { useEffect, useMemo, useState } from "react"
import { useSWRConfig } from "swr"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { GitBranch, Loader2 } from "lucide-react"
import { useIntegrationBaselines } from "@/lib/hooks/use-platform-data"
import { BASELINE_STATUS_LABELS } from "@/lib/types"

const NEW_BASELINE_VALUE = "__new__"

interface PublishIntegrationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  componentKey: string
  componentName: string
  defaultVersion?: string
  buildId?: string
}

export function PublishIntegrationDialog({
  open,
  onOpenChange,
  componentKey,
  componentName,
  defaultVersion = "",
  buildId,
}: PublishIntegrationDialogProps) {
  const { mutate } = useSWRConfig()
  const { data: baselines } = useIntegrationBaselines({ pageSize: 50 })

  const [targetBaseline, setTargetBaseline] = useState<string>("")
  const [newVersion, setNewVersion] = useState("")
  const [newDescription, setNewDescription] = useState("")
  const [version, setVersion] = useState(defaultVersion)
  const [submitting, setSubmitting] = useState(false)

  const candidates = useMemo(() => baselines?.items ?? [], [baselines])

  useEffect(() => {
    if (open) {
      setVersion(defaultVersion)
      setNewVersion("")
      setNewDescription("")
      const firstDraft = candidates.find((b) => b.status === "draft")
      setTargetBaseline(firstDraft ? firstDraft.version : NEW_BASELINE_VALUE)
    }
  }, [open, defaultVersion, candidates])

  async function handleSubmit() {
    if (!version.trim()) {
      toast.error("请填写发布版本号")
      return
    }

    setSubmitting(true)
    try {
      let baselineVersion = targetBaseline

      if (targetBaseline === NEW_BASELINE_VALUE) {
        if (!newVersion.trim()) {
          toast.error("请填写新基线的版本号")
          setSubmitting(false)
          return
        }
        const createRes = await fetch("/api/integration-baselines", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ version: newVersion.trim(), description: newDescription.trim() || undefined }),
        })
        const createBody = await createRes.json()
        if (!createRes.ok) throw new Error(createBody?.message ?? "新建基线失败")
        baselineVersion = createBody.version
        void mutate((key) => typeof key === "string" && key.startsWith("/api/integration-baselines"))
      }

      const publishRes = await fetch(
        `/api/integration-baselines/${encodeURIComponent(baselineVersion)}/publish`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ componentKey, version: version.trim(), buildId }),
        },
      )
      const publishBody = await publishRes.json()
      if (!publishRes.ok) throw new Error(publishBody?.message ?? "发布集成失败")

      toast.success(`已将 ${componentName} ${version.trim()} 发布至基线 ${baselineVersion}`)
      void mutate((key) => typeof key === "string" && key.startsWith("/api/integration-baselines"))
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "发布集成失败，请稍后重试")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !submitting && onOpenChange(o)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>发布集成</DialogTitle>
          <DialogDescription>
            将「{componentName}」的构建产物写入指定基线版本的依赖配置，供集成总流水线打包时读取。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label className="text-xs">发布版本号</Label>
            <Input
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="如 1.3.0"
              className="h-9 font-mono text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs">目标基线版本</Label>
            <Select value={targetBaseline} onValueChange={setTargetBaseline}>
              <SelectTrigger className="h-9 text-sm">
                <GitBranch className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {candidates
                  .filter((b) => !b.isDefault)
                  .map((b) => (
                    <SelectItem key={b.id} value={b.version} disabled={b.status !== "draft"}>
                      <span className="flex items-center gap-2">
                        <span className="font-mono">{b.version}</span>
                        <Badge variant="secondary" className="text-[9px]">
                          {BASELINE_STATUS_LABELS[b.status]}
                        </Badge>
                        {b.status !== "draft" && (
                          <span className="text-[10px] text-muted-foreground">（清单已锁定，不可修改）</span>
                        )}
                      </span>
                    </SelectItem>
                  ))}
                <SelectItem value={NEW_BASELINE_VALUE}>+ 新建基线版本</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {targetBaseline === NEW_BASELINE_VALUE && (
            <div className="space-y-3 rounded-lg border border-dashed border-border p-3">
              <div className="space-y-2">
                <Label className="text-xs">新基线版本号</Label>
                <Input
                  value={newVersion}
                  onChange={(e) => setNewVersion(e.target.value)}
                  placeholder="如 V1.2.0"
                  className="h-9 font-mono text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">描述（可选）</Label>
                <Input
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="用于说明本次基线的用途"
                  className="h-9 text-sm"
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            确认发布
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
