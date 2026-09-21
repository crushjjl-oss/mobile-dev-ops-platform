"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
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
import { Boxes, Plus, Pencil, GitBranch, ExternalLink, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useIntegrationComponents, usePipelines } from "@/lib/hooks/use-platform-data"
import { COMPONENT_TYPE_LABELS } from "@/lib/types"
import type { ComponentType, IntegrationComponent } from "@/lib/types"
import { ErrorState, EmptyState, TableSkeleton } from "@/components/ui/data-states"

const typeBadgeStyle: Record<ComponentType, string> = {
  shell: "bg-[hsl(199,89%,48%)]/10 text-status-info",
  business: "bg-secondary text-muted-foreground",
  foundation: "bg-[hsl(262,83%,58%)]/10 text-[hsl(262,83%,64%)]",
}

interface FormState {
  key: string
  name: string
  type: ComponentType
  pipelineId: string
  projectId: string
  description: string
}

const emptyForm: FormState = {
  key: "",
  name: "",
  type: "business",
  pipelineId: "",
  projectId: "",
  description: "",
}

export function ComponentManagementPage() {
  const { data: components, error, isLoading, mutate } = useIntegrationComponents()
  const { data: pipelinesPage } = usePipelines({ pageSize: 100 })

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [togglingKey, setTogglingKey] = useState<string | null>(null)

  const pipelines = pipelinesPage?.items ?? []
  const pipelineName = useMemo(() => {
    const map = new Map<string, string>()
    for (const p of pipelines) map.set(p.id, p.name)
    return map
  }, [pipelines])

  function openCreate() {
    setEditingKey(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  function openEdit(c: IntegrationComponent) {
    setEditingKey(c.key)
    setForm({
      key: c.key,
      name: c.name,
      type: c.type,
      pipelineId: c.pipelineId,
      projectId: c.projectId,
      description: c.description,
    })
    setDialogOpen(true)
  }

  function onPipelineChange(pipelineId: string) {
    // 选定流水线时自动带出其所属项目，减少手填
    const p = pipelines.find((x) => x.id === pipelineId)
    setForm((prev) => ({ ...prev, pipelineId, projectId: p?.projectId ?? prev.projectId }))
  }

  async function handleSave() {
    if (!form.name.trim()) {
      toast.error("请填写组件名称")
      return
    }
    if (!editingKey && !form.key.trim()) {
      toast.error("请填写组件标识（key）")
      return
    }
    if (!form.pipelineId) {
      toast.error("请关联一条流水线")
      return
    }
    setSaving(true)
    try {
      const url = editingKey
        ? `/api/integration-components/${encodeURIComponent(editingKey)}`
        : "/api/integration-components"
      const res = await fetch(url, {
        method: editingKey ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: form.key.trim(),
          name: form.name.trim(),
          type: form.type,
          pipelineId: form.pipelineId,
          projectId: form.projectId,
          description: form.description.trim(),
        }),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body?.message ?? "保存失败")
      toast.success(editingKey ? "组件已更新" : `组件 ${body.name} 已注册`)
      await mutate()
      setDialogOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "保存失败，请稍后重试")
    } finally {
      setSaving(false)
    }
  }

  async function handleToggle(c: IntegrationComponent) {
    const next = c.status === "active" ? "disabled" : "active"
    setTogglingKey(c.key)
    try {
      const res = await fetch(`/api/integration-components/${encodeURIComponent(c.key)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body?.message ?? "操作失败")
      toast.success(next === "active" ? `已启用 ${c.name}` : `已停用 ${c.name}`)
      await mutate()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "操作失败，请稍后重试")
    } finally {
      setTogglingKey(null)
    }
  }

  if (isLoading) return <div className="p-6"><TableSkeleton rows={6} columns={5} /></div>
  if (error) return <div className="p-6"><ErrorState error={error} onRetry={() => void mutate()} /></div>

  const list = components ?? []

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-semibold text-foreground">组件管理</h1>
          <p className="text-sm text-muted-foreground">
            注册壳子 App 与各业务、基础组件（SDK），关联其构建流水线；停用的组件不再参与新版本组版
          </p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" />
          注册组件
        </Button>
      </div>

      {list.length === 0 ? (
        <EmptyState title="暂无组件" description="点击右上角注册第一个组件并关联其流水线" />
      ) : (
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Boxes className="w-4 h-4 text-status-info" />
              <CardTitle className="text-sm">已注册组件（{list.length}）</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="border border-border rounded-lg divide-y divide-border">
              <div className="flex items-center gap-4 px-4 py-2 text-[11px] font-medium text-muted-foreground bg-secondary/30">
                <span className="flex-1">组件</span>
                <span className="w-28">类型</span>
                <span className="w-48">关联流水线</span>
                <span className="w-24 text-center">状态</span>
                <span className="w-20 text-right">操作</span>
              </div>
              {list.map((c) => (
                <div
                  key={c.key}
                  className={cn(
                    "flex items-center gap-4 px-4 py-3",
                    c.status === "disabled" && "opacity-60",
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground flex items-center gap-2">
                      {c.name}
                      <span className="font-mono text-[11px] text-muted-foreground">{c.key}</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground truncate">{c.description || "无描述"}</div>
                  </div>
                  <span className="w-28">
                    <Badge className={cn("text-[10px] border-0", typeBadgeStyle[c.type])}>
                      {COMPONENT_TYPE_LABELS[c.type]}
                    </Badge>
                  </span>
                  <span className="w-48 min-w-0">
                    <Link
                      href={`/pipelines/${c.pipelineId}`}
                      className="text-xs text-foreground hover:text-status-info inline-flex items-center gap-1 truncate"
                    >
                      <GitBranch className="w-3 h-3 shrink-0" />
                      <span className="truncate">{pipelineName.get(c.pipelineId) ?? c.pipelineId}</span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </Link>
                  </span>
                  <span className="w-24 flex items-center justify-center gap-2">
                    <Switch
                      checked={c.status === "active"}
                      disabled={togglingKey === c.key}
                      onCheckedChange={() => void handleToggle(c)}
                      aria-label={c.status === "active" ? "停用组件" : "启用组件"}
                    />
                  </span>
                  <span className="w-20 text-right">
                    <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => openEdit(c)}>
                      <Pencil className="w-3.5 h-3.5" />
                      <span className="sr-only">编辑</span>
                    </Button>
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingKey ? "编辑组件" : "注册组件"}</DialogTitle>
            <DialogDescription>
              {editingKey ? "修改组件信息与关联流水线" : "登记一个新组件并关联其已配置好的构建流水线"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs">组件标识（key）</Label>
                <Input
                  value={form.key}
                  onChange={(e) => setForm({ ...form, key: e.target.value })}
                  placeholder="如 sdk-payment"
                  disabled={!!editingKey}
                  className="h-9 font-mono text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">组件名称</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="如 支付组件"
                  className="h-9 text-sm"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">组件类型</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as ComponentType })}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(COMPONENT_TYPE_LABELS) as ComponentType[]).map((t) => (
                    <SelectItem key={t} value={t}>
                      {COMPONENT_TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">关联流水线</Label>
              <Select value={form.pipelineId} onValueChange={onPipelineChange}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="选择该组件的构建流水线" />
                </SelectTrigger>
                <SelectContent>
                  {pipelines.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">描述（可选）</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="用于说明组件职责"
                className="text-sm min-h-16"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              取消
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingKey ? "保存" : "注册"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
