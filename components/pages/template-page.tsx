"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Search, Plus, Copy, Smartphone, Globe, Apple, MonitorSmartphone, LayoutGrid } from "lucide-react"
import { useTemplates } from "@/lib/hooks/use-platform-data"
import { CardGridSkeleton, ErrorState, EmptyState, Pagination } from "@/components/ui/data-states"
import { PLATFORM_LABELS, type Platform } from "@/lib/types"

const platformIconMap: Record<string, typeof Smartphone> = {
  iOS: Apple,
  Android: Smartphone,
  H5: Globe,
  HarmonyOS: MonitorSmartphone,
  All: LayoutGrid,
}

const platformColorMap: Record<string, string> = {
  iOS: "bg-secondary text-muted-foreground",
  Android: "bg-accent-success text-status-success",
  H5: "bg-accent-info text-status-info",
  HarmonyOS: "bg-accent-warning text-status-warning",
  All: "bg-secondary text-foreground",
}

export function TemplatePage() {
  const [search, setSearch] = useState("")
  const [platform, setPlatform] = useState("all")
  const [page, setPage] = useState(1)

  const { data, error, isLoading, mutate } = useTemplates({
    search: search || undefined,
    platform: platform === "all" ? undefined : platform,
    page,
    pageSize: 12,
  })

  function handleSearch(value: string) {
    setSearch(value)
    setPage(1)
  }

  function handlePlatform(value: string) {
    setPlatform(value)
    setPage(1)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">流水线模板</h1>
          <p className="text-sm text-muted-foreground">可复用的流水线配置，快速启动项目</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <Plus className="w-4 h-4 mr-2" />
          创建模板
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="搜索模板..."
            className="pl-9 h-9 text-sm bg-card border-border"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
        <Select value={platform} onValueChange={handlePlatform}>
          <SelectTrigger className="w-36 h-9 text-xs">
            <SelectValue placeholder="平台" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部平台</SelectItem>
            <SelectItem value="All">跨平台</SelectItem>
            {Object.entries(PLATFORM_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <CardGridSkeleton count={6} />
      ) : error ? (
        <ErrorState error={error} onRetry={() => mutate()} />
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          filtered={!!search || platform !== "all"}
          onClearFilters={() => {
            setSearch("")
            setPlatform("all")
            setPage(1)
          }}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.items.map((tpl) => {
              const PlatformIcon = platformIconMap[tpl.platform] || Smartphone
              const platformLabel = tpl.platform === "All" ? "全平台" : PLATFORM_LABELS[tpl.platform as Platform]
              return (
                <Card key={tpl.id} className="bg-card border-border hover:border-primary/30 transition-colors group">
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                        <PlatformIcon className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <CardTitle className="text-sm font-semibold text-foreground">{tpl.name}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className={`text-[10px] ${platformColorMap[tpl.platform] || ""}`}>
                            {platformLabel}
                          </Badge>
                          {tpl.official && (
                            <Badge variant="secondary" className="text-[10px] bg-accent-info text-status-info">
                              官方
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-xs text-muted-foreground leading-relaxed">{tpl.desc}</p>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{tpl.stages} 个阶段</span>
                      <span>{tpl.usedBy} 条流水线在使用</span>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-border">
                      <span className="text-[11px] text-muted-foreground">
                        {tpl.author} · {tpl.updatedAt}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs border-border text-foreground hover:border-primary hover:text-status-info bg-transparent"
                      >
                        <Copy className="w-3 h-3 mr-1" />
                        使用模板
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
          {data.totalPages > 1 && (
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
