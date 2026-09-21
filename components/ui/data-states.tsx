"use client"

/**
 * 数据三态组件 —— 加载 / 错误 / 空
 *
 * 所有列表与详情页统一使用，保证企业环境下网络延迟、请求失败、
 * 数据为空这三种真实场景都有明确的界面反馈。
 */

import type { ReactNode } from "react"
import { AlertCircle, Inbox, RefreshCw, SearchX, ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// ---------- 骨架屏基元 ----------

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded bg-muted", className)} aria-hidden="true" />
}

/** 表格加载骨架 */
export function TableSkeleton({ rows = 8, columns = 6 }: { rows?: number; columns?: number }) {
  return (
    <div className="w-full" role="status" aria-label="正在加载数据">
      <span className="sr-only">正在加载数据</span>
      <div className="flex items-center gap-4 border-b border-border px-4 py-3">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-3 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-4 border-b border-border/50 px-4 py-4">
          {Array.from({ length: columns }).map((_, c) => (
            <Skeleton key={c} className={cn("h-4 flex-1", c === 0 && "max-w-[80px]")} />
          ))}
        </div>
      ))}
    </div>
  )
}

/** 卡片网格加载骨架 */
export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div
      className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
      role="status"
      aria-label="正在加载数据"
    >
      <span className="sr-only">正在加载数据</span>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-start gap-3">
            <Skeleton className="h-10 w-10 rounded-md" />
            <div className="flex-1">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="mt-2 h-3 w-full" />
            </div>
          </div>
          <Skeleton className="mt-4 h-3 w-full" />
          <Skeleton className="mt-2 h-3 w-4/5" />
          <div className="mt-5 flex gap-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  )
}

/** 指标卡加载骨架 */
export function MetricsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" role="status" aria-label="正在加载指标">
      <span className="sr-only">正在加载指标</span>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-lg border border-border bg-card p-5">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="mt-3 h-8 w-24" />
          <Skeleton className="mt-3 h-3 w-16" />
        </div>
      ))}
    </div>
  )
}

// ---------- 错误态 ----------

interface ErrorStateProps {
  /** 错误对象，若含 status 会据此调整文案 */
  error?: { message?: string; status?: number } | null
  /** 重试回调，通常传 SWR 的 mutate */
  onRetry?: () => void
  /** 覆盖标题 */
  title?: string
  className?: string
}

export function ErrorState({ error, onRetry, title, className }: ErrorStateProps) {
  const status = error?.status
  const isNotFound = status === 404
  const isForbidden = status === 401 || status === 403

  const Icon = isForbidden ? ShieldAlert : isNotFound ? SearchX : AlertCircle
  const heading =
    title ?? (isNotFound ? "未找到相关数据" : isForbidden ? "没有访问权限" : "数据加载失败")
  const description =
    error?.message ??
    (isForbidden
      ? "当前账号无权查看该资源，请联系管理员申请权限。"
      : "请检查网络连接后重试，若持续失败请联系平台管理员。")

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-border bg-card px-6 py-16 text-center",
        className,
      )}
      role="alert"
    >
      <div
        className={cn(
          "flex h-12 w-12 items-center justify-center rounded-full",
          isForbidden ? "bg-accent-warning" : "bg-accent-danger",
        )}
      >
        <Icon
          className={cn("h-6 w-6", isForbidden ? "text-status-warning" : "text-status-danger")}
          aria-hidden="true"
        />
      </div>
      <h3 className="mt-4 text-base font-semibold text-foreground">{heading}</h3>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">{description}</p>
      {status ? (
        <p className="mt-2 font-mono text-xs text-muted-foreground/70">错误码 {status}</p>
      ) : null}
      {onRetry && !isForbidden ? (
        <Button variant="outline" size="sm" className="mt-5 gap-2 bg-transparent" onClick={onRetry}>
          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
          重新加载
        </Button>
      ) : null}
    </div>
  )
}

// ---------- 空态 ----------

interface EmptyStateProps {
  title?: string
  description?: string
  /** 是否因筛选导致为空，会显示不同文案与清除按钮 */
  filtered?: boolean
  onClearFilters?: () => void
  action?: ReactNode
  icon?: typeof Inbox
  className?: string
}

export function EmptyState({
  title,
  description,
  filtered = false,
  onClearFilters,
  action,
  icon,
  className,
}: EmptyStateProps) {
  const Icon = icon ?? (filtered ? SearchX : Inbox)
  const heading = title ?? (filtered ? "没有匹配的结果" : "暂无数据")
  const desc =
    description ??
    (filtered
      ? "当前筛选条件下没有找到任何记录，可尝试调整关键词或清除筛选。"
      : "这里还没有任何记录。")

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card/50 px-6 py-16 text-center",
        className,
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <Icon className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-foreground">{heading}</h3>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">{desc}</p>
      {filtered && onClearFilters ? (
        <Button variant="outline" size="sm" className="mt-5 bg-transparent" onClick={onClearFilters}>
          清除筛选条件
        </Button>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  )
}

// ---------- 分页 ----------

interface PaginationProps {
  page: number
  totalPages: number
  total: number
  pageSize: number
  onPageChange: (page: number) => void
}

export function Pagination({ page, totalPages, total, pageSize, onPageChange }: PaginationProps) {
  if (total === 0) return null

  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  // 生成页码窗口：始终显示首末页，当前页两侧各一页
  const pages: (number | "gap")[] = []
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - page) <= 1) {
      pages.push(i)
    } else if (pages[pages.length - 1] !== "gap") {
      pages.push("gap")
    }
  }

  return (
    <nav
      className="flex flex-col items-center justify-between gap-3 border-t border-border px-4 py-3 sm:flex-row"
      aria-label="分页导航"
    >
      <p className="text-xs text-muted-foreground">
        显示第 <span className="font-medium text-foreground">{from}</span> –{" "}
        <span className="font-medium text-foreground">{to}</span> 条，共{" "}
        <span className="font-medium text-foreground">{total}</span> 条
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          className="h-8 bg-transparent px-3 text-xs"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          上一页
        </Button>
        {pages.map((p, i) =>
          p === "gap" ? (
            <span key={`gap-${i}`} className="px-1 text-xs text-muted-foreground" aria-hidden="true">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              aria-current={p === page ? "page" : undefined}
              aria-label={`第 ${p} 页`}
              className={cn(
                "h-8 min-w-8 rounded-md px-2 text-xs font-medium transition-colors",
                p === page
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              {p}
            </button>
          ),
        )}
        <Button
          variant="outline"
          size="sm"
          className="h-8 bg-transparent px-3 text-xs"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          下一页
        </Button>
      </div>
    </nav>
  )
}
