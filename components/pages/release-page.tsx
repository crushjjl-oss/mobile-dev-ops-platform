"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Clock, CheckCircle2, XCircle, Upload, Undo2, RotateCcw, FileEdit, Search } from "lucide-react"
import { useReleases } from "@/lib/hooks/use-platform-data"
import { TableSkeleton, ErrorState, EmptyState, Pagination } from "@/components/ui/data-states"
import { RELEASE_STATUS_LABELS, type ReleaseStatus } from "@/lib/types"

const statusConfig: Record<ReleaseStatus, { className: string; icon: React.ReactNode }> = {
  in_review: { className: "bg-accent-warning text-status-warning", icon: <Clock className="w-3 h-3" /> },
  released: { className: "bg-accent-success text-status-success", icon: <CheckCircle2 className="w-3 h-3" /> },
  rejected: { className: "bg-accent-danger text-status-danger", icon: <XCircle className="w-3 h-3" /> },
  draft: { className: "bg-muted text-muted-foreground", icon: <FileEdit className="w-3 h-3" /> },
  rolled_back: { className: "bg-accent-warning text-status-warning", icon: <RotateCcw className="w-3 h-3" /> },
}

export function ReleasePage() {
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("all")
  const [tab, setTab] = useState("all")
  const [page, setPage] = useState(1)

  const effectiveStatus = tab === "pending" ? "in_review" : status
  const { data, error, isLoading, mutate } = useReleases({
    search: search || undefined,
    status: effectiveStatus === "all" ? undefined : effectiveStatus,
    page,
    pageSize: 10,
  })

  function handleSearch(value: string) {
    setSearch(value)
    setPage(1)
  }

  function handleStatus(value: string) {
    setStatus(value)
    setPage(1)
  }

  function handleTab(value: string) {
    setTab(value)
    setPage(1)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">发布管理</h1>
          <p className="text-sm text-muted-foreground">管理应用发布、审批和部署</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Plus className="w-4 h-4 mr-2" />
              新建发布申请
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg bg-card border-border">
            <DialogHeader>
              <DialogTitle>创建发布申请</DialogTitle>
              <DialogDescription>填写以下信息提交新的发布申请</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>构建产物 *</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="选择构建" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1284">构建 #1284 - 启源 App v2.3.0</SelectItem>
                    <SelectItem value="1278">构建 #1278 - 引力 App v1.8.2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>目标渠道 *</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="选择发布渠道" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pgyer">蒲公英</SelectItem>
                    <SelectItem value="app-store">App Store</SelectItem>
                    <SelectItem value="agc">华为 AGC</SelectItem>
                    <SelectItem value="cdn">CDN</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>发布说明 *</Label>
                <Textarea placeholder="描述本次发布的变更内容..." rows={3} />
              </div>
              <div className="space-y-2">
                <Label>测试结论 *</Label>
                <Textarea placeholder="总结测试结果..." rows={2} />
              </div>
              <div className="space-y-2">
                <Label>审核材料</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                  <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">拖拽文件到此处或点击上传</p>
                  <p className="text-xs text-muted-foreground mt-1">测试报告、截图等</p>
                </div>
              </div>
              <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">提交申请</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={tab} onValueChange={handleTab}>
        <div className="flex items-center justify-between gap-3">
          <TabsList className="bg-secondary">
            <TabsTrigger value="all">全部发布</TabsTrigger>
            <TabsTrigger value="pending">待审批</TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="搜索版本号或项目..."
                className="h-9 w-56 pl-8"
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
            {tab === "all" && (
              <Select value={status} onValueChange={handleStatus}>
                <SelectTrigger className="h-9 w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  {Object.entries(RELEASE_STATUS_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        <TabsContent value={tab} className="mt-4">
          {isLoading ? (
            <TableSkeleton rows={6} columns={4} />
          ) : error ? (
            <ErrorState error={error} onRetry={() => mutate()} />
          ) : !data || data.items.length === 0 ? (
            <EmptyState filtered={!!search || status !== "all"} onClearFilters={() => { setSearch(""); setStatus("all") }} />
          ) : (
            <div className="border border-border rounded-lg divide-y divide-border">
              {data.items.map((rel) => (
                <div key={rel.id} className="flex items-center gap-4 p-4 hover:bg-secondary/30 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-mono text-sm text-status-info">{rel.id}</span>
                      <span className="text-sm font-medium text-foreground">{rel.project}</span>
                      <Badge variant="secondary" className="text-[10px] font-mono">
                        {rel.version}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        {rel.platform}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        {rel.channel}
                      </Badge>
                    </div>
                    {rel.notes && <div className="text-xs text-muted-foreground">{rel.notes}</div>}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      <span>由 {rel.operator} 操作</span>
                      <span>{rel.releasedAt}</span>
                      {rel.status === "released" && <span>灰度 {rel.rolloutPercent}%</span>}
                    </div>
                  </div>
                  <Badge variant="secondary" className={`text-[10px] gap-1 ${statusConfig[rel.status]?.className}`}>
                    {statusConfig[rel.status]?.icon}
                    {RELEASE_STATUS_LABELS[rel.status]}
                  </Badge>
                  {rel.status === "released" && (
                    <Button size="sm" variant="outline" className="text-xs bg-transparent">
                      <Undo2 className="w-3 h-3 mr-1" /> 回滚
                    </Button>
                  )}
                </div>
              ))}
              {data.totalPages > 1 && (
                <Pagination
                  page={data.page}
                  totalPages={data.totalPages}
                  total={data.total}
                  pageSize={data.pageSize}
                  onPageChange={setPage}
                />
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
