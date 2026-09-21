"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Plus,
  Search,
  LayoutGrid,
  List,
  CheckCircle2,
  GitBranch,
  Clock,
  Users,
  Smartphone,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useProjects } from "@/lib/hooks/use-platform-data"
import { ErrorState, CardGridSkeleton, EmptyState, Pagination } from "@/components/ui/data-states"
import { BRAND_LABELS, brandLabel, type Brand } from "@/lib/types"

// 键与 Brand 类型对齐（英文标识），避免与展示用中文名脱节
const brandColors: Record<Brand, string> = {
  Qiyuan: "bg-[hsl(199,89%,48%)]/10 text-status-info border-[hsl(199,89%,48%)]/20",
  Gravity: "bg-[hsl(262,52%,47%)]/10 text-status-purple border-[hsl(262,52%,47%)]/20",
  DeepBlue: "bg-[hsl(199,89%,30%)]/10 text-status-info border-[hsl(199,89%,30%)]/20",
  TopSpace: "bg-[hsl(38,92%,50%)]/10 text-status-warning border-[hsl(38,92%,50%)]/20",
}

export function ProjectListPage() {
  const [view, setView] = useState<"grid" | "list">("grid")
  const [search, setSearch] = useState("")
  const [brandFilter, setBrandFilter] = useState<Brand | "all">("all")
  const [page, setPage] = useState(1)

  // 搜索与品牌筛选下推到服务端，配合分页支持企业级检索
  const { data, error, isLoading, mutate } = useProjects({
    search: search || undefined,
    brand: brandFilter === "all" ? undefined : brandFilter,
    page,
    pageSize: 9,
  })

  const filtered = data?.items ?? []

  function handleSearch(value: string) {
    setSearch(value)
    setPage(1)
  }

  function handleBrandFilter(value: Brand | "all") {
    setBrandFilter(value)
    setPage(1)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">{"\u9879\u76EE\u7BA1\u7406"}</h1>
          <p className="text-sm text-muted-foreground">{"\u7BA1\u7406\u6240\u6709\u79FB\u52A8\u5E94\u7528\u9879\u76EE"}</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-[hsl(199,89%,48%)] hover:bg-[hsl(199,89%,42%)] text-white">
              <Plus className="w-4 h-4 mr-2" />
              {"\u65B0\u5EFA\u9879\u76EE"}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg bg-card border-border">
<DialogHeader>
                <DialogTitle>{"\u521B\u5EFA\u65B0\u9879\u76EE"}</DialogTitle>
                <DialogDescription>{"\u914D\u7F6E\u65B0\u9879\u76EE\u7684\u57FA\u672C\u4FE1\u606F"}</DialogDescription>
              </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>{"\u9879\u76EE\u540D\u79F0 *"}</Label>
                <Input placeholder={"\u8F93\u5165\u9879\u76EE\u540D\u79F0"} />
              </div>
              <div className="space-y-2">
                <Label>{"\u54C1\u724C *"}</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder={"\u9009\u62E9\u54C1\u724C"} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Qiyuan">{"\u542F\u6E90"}</SelectItem>
                    <SelectItem value="Gravity">{"\u5F15\u529B"}</SelectItem>
                    <SelectItem value="DeepBlue">{"\u6DF1\u84DD"}</SelectItem>
                    <SelectItem value="TopSpace">TopSpace</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{"\u76EE\u6807\u5E73\u53F0 *"}</Label>
                <div className="flex gap-2">
                  {["Android", "iOS", "H5", "HarmonyOS"].map((p) => (
                    <Badge key={p} variant="outline" className="cursor-pointer hover:bg-secondary px-3 py-1">{p}</Badge>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>{"\u8D1F\u8D23\u4EBA *"}</Label>
                <Input placeholder={"\u641C\u7D22 CAC \u7528\u6237"} />
              </div>
              <div className="space-y-2">
                <Label>{"\u63CF\u8FF0"}</Label>
                <Textarea placeholder={"\u9879\u76EE\u63CF\u8FF0"} rows={3} />
              </div>
              <div className="space-y-2">
                <Label>{"\u4ED3\u5E93\u5730\u5740"}</Label>
                <Input placeholder="https://git.example.com/repo.git" />
              </div>
              <Button className="w-full bg-[hsl(199,89%,48%)] hover:bg-[hsl(199,89%,42%)] text-white">
                {"\u521B\u5EFA\u9879\u76EE"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder={"\u641C\u7D22\u9879\u76EE..."} className="pl-9" value={search} onChange={(e) => handleSearch(e.target.value)} />
        </div>
        <Select value={brandFilter} onValueChange={(v) => handleBrandFilter(v as Brand | "all")}>
          <SelectTrigger className="w-40" aria-label="按品牌筛选">
            <SelectValue placeholder="品牌" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{"\u5168\u90E8\u54C1\u724C"}</SelectItem>
            {/* 选项由类型化常量派生，避免筛选值与数据层品牌名脱节 */}
            {BRAND_LABELS.map((brand) => (
              <SelectItem key={brand.value} value={brand.value}>
                {brand.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex border border-border rounded-md" role="group" aria-label="切换视图模式">
          <button
            onClick={() => setView("grid")}
            aria-label="网格视图"
            aria-pressed={view === "grid"}
            className={cn("p-2 rounded-l-md", view === "grid" ? "bg-secondary" : "hover:bg-secondary/50")}
          >
            <LayoutGrid className="w-4 h-4" aria-hidden="true" />
          </button>
          <button
            onClick={() => setView("list")}
            aria-label="列表视图"
            aria-pressed={view === "list"}
            className={cn("p-2 rounded-r-md", view === "list" ? "bg-secondary" : "hover:bg-secondary/50")}
          >
            <List className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Project Grid */}
      {isLoading ? (
        <CardGridSkeleton count={6} />
      ) : error ? (
        <ErrorState error={error} onRetry={() => void mutate()} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="未找到匹配的项目"
          description={search || brandFilter !== "all" ? "请调整搜索关键词或品牌筛选条件。" : "还没有项目，点击右上角新建项目开始。"}
        />
      ) : (
        <>
        {view === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((proj) => (
            <Card
              key={proj.id}
              className="relative bg-card border-border hover:border-[hsl(199,89%,48%)]/30 transition-colors group focus-within:ring-2 focus-within:ring-[hsl(199,89%,48%)]/40"
            >
              {/* 整卡可点击：覆盖式链接保留原生语义（可 Cmd+点击新开、可键盘聚焦） */}
              <Link
                href={`/projects/${proj.id}`}
                className="absolute inset-0 z-10 rounded-lg outline-none"
                aria-label={`查看项目 ${proj.name} 详情`}
              />
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-medium text-foreground group-hover:text-status-info transition-colors">{proj.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{proj.desc}</p>
                  </div>
                  <Badge variant="outline" className={cn("text-[10px]", brandColors[proj.brand])}>
                    {brandLabel(proj.brand)}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {proj.platforms.map((p) => (
                    <Badge key={p} variant="secondary" className="text-[10px] px-2 py-0">
                      <Smartphone className="w-3 h-3 mr-1" />
                      {p}
                    </Badge>
                  ))}
                </div>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div>
                    <div className="text-xs font-medium text-foreground flex items-center justify-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-status-success" />
                      {proj.successRate}%
                    </div>
                    <div className="text-[10px] text-muted-foreground">Success</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-foreground flex items-center justify-center gap-1">
                      <GitBranch className="w-3 h-3 text-status-info" />
                      {proj.pipelines}
                    </div>
                    <div className="text-[10px] text-muted-foreground">Pipelines</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-foreground flex items-center justify-center gap-1">
                      <Users className="w-3 h-3 text-muted-foreground" />
                      {proj.members}
                    </div>
                    <div className="text-[10px] text-muted-foreground">Members</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-foreground flex items-center justify-center gap-1">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                    </div>
                    <div className="text-[10px] text-muted-foreground">{proj.lastBuild}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="border border-border rounded-lg divide-y divide-border">
          {filtered.map((proj) => (
            <Link
              key={proj.id}
              href={`/projects/${proj.id}`}
              className="flex items-center gap-4 p-4 hover:bg-secondary/30 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-foreground">{proj.name}</span>
                  <Badge variant="outline" className={cn("text-[10px]", brandColors[proj.brand])}>{brandLabel(proj.brand)}</Badge>
                  {proj.status === "archived" && <Badge variant="secondary" className="text-[10px]">已归档</Badge>}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{proj.desc}</p>
              </div>
              <div className="flex items-center gap-6 text-xs text-muted-foreground">
                <span>{proj.platforms.join("、")}</span>
                <span>{proj.successRate}% 成功率</span>
                <span>{proj.members} 名成员</span>
                <span>{proj.lastBuild}</span>
              </div>
            </Link>
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
        </>
      )}
    </div>
  )
}
