"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import type { ReactNode } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Boxes,
  Bell,
  Settings,
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Loader2,
  LogOut,
  User,
  Search,
} from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/theme-toggle"
import { navSections, isNavActive, buildBreadcrumb } from "@/lib/nav-config"
import { useSession, useBuilds } from "@/lib/hooks/use-platform-data"
import { ROLE_LABELS, BUILD_STATUS_LABELS } from "@/lib/types"
import type { BuildStatus } from "@/lib/types"

// ---------- 页面标题上下文 ----------

interface PageHeaderValue {
  setTitle: (title: string | null) => void
}

const PageHeaderContext = createContext<PageHeaderValue>({ setTitle: () => {} })

/**
 * 详情页调用此 hook 向顶部面包屑注入真实对象名。
 * 例如构建详情页传入「构建 #1284」，面包屑即显示「构建记录 / 构建 #1284」。
 */
export function usePageTitle(title: string | null | undefined) {
  const { setTitle } = useContext(PageHeaderContext)
  useEffect(() => {
    setTitle(title ?? null)
    return () => setTitle(null)
  }, [title, setTitle])
}

// ---------- 品牌筛选上下文 ----------

const BrandContext = createContext<string>("all")

/** 看板等页面读取当前选中的品牌筛选值 */
export function useBrandFilter() {
  return useContext(BrandContext)
}

// ---------- 通知图标映射 ----------

const STATUS_ICON: Record<
  BuildStatus,
  { icon: typeof CheckCircle2; className: string; spin?: boolean }
> = {
  success: { icon: CheckCircle2, className: "text-status-success" },
  failed: { icon: XCircle, className: "text-status-danger" },
  running: { icon: Loader2, className: "text-status-info", spin: true },
  pending: { icon: Loader2, className: "text-muted-foreground" },
  cancelled: { icon: XCircle, className: "text-muted-foreground" },
}

// ---------- 主框架 ----------

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [brand, setBrand] = useState("all")
  const [dynamicTitle, setDynamicTitle] = useState<string | null>(null)
  const [loggingOut, setLoggingOut] = useState(false)

  const setTitle = useCallback((t: string | null) => setDynamicTitle(t), [])
  const headerValue = useMemo(() => ({ setTitle }), [setTitle])

  const crumbs = useMemo(() => buildBreadcrumb(pathname, dynamicTitle), [pathname, dynamicTitle])

  // 当前登录用户（顶栏展示真实身份，而非写死）
  const { data: session } = useSession()
  const displayName = session?.displayName ?? "—"
  const roleLabel = session ? ROLE_LABELS[session.role] : ""
  const initials = useMemo(() => {
    const name = session?.username ?? ""
    return name ? name.slice(0, 2).toUpperCase() : "--"
  }, [session?.username])

  // 通知：取最近构建，失败/运行中的作为需要关注的动态
  const { data: recentBuilds } = useBuilds({ page: 1, pageSize: 8 })
  const notifications = useMemo(() => {
    const items = recentBuilds?.items ?? []
    return items
      .filter((b) => b.status === "failed" || b.status === "running" || b.status === "success")
      .slice(0, 6)
  }, [recentBuilds])
  const unreadCount = useMemo(
    () => notifications.filter((b) => b.status === "failed").length,
    [notifications],
  )

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await fetch("/api/auth/logout", { method: "POST" })
    } catch {
      // 即使请求失败也继续跳转，避免用户卡在已登出状态
    }
    router.replace("/login")
  }

  return (
    <TooltipProvider delayDuration={300}>
      <BrandContext.Provider value={brand}>
        <PageHeaderContext.Provider value={headerValue}>
          <div className="flex h-screen overflow-hidden bg-background">
            {/* 侧边栏 */}
            <aside
              className={cn(
                "flex flex-shrink-0 flex-col border-r border-sidebar-border bg-sidebar-background transition-all duration-300",
                sidebarCollapsed ? "w-[60px]" : "w-[220px]",
              )}
            >
              {/* Logo */}
              <div className="flex h-14 flex-shrink-0 items-center gap-2.5 border-b border-sidebar-border px-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[hsl(199,89%,48%)] to-[hsl(199,89%,38%)] shadow-lg shadow-[hsl(199,89%,48%)]/20">
                  <Boxes className="h-5 w-5 text-white" aria-hidden="true" />
                </div>
                {!sidebarCollapsed && (
                  <div className="overflow-hidden">
                    <span className="block whitespace-nowrap text-sm font-bold leading-tight text-foreground">
                      智能构建平台
                    </span>
                    <span className="block whitespace-nowrap text-[10px] text-sidebar-foreground/60">
                      移动端 CI/CD 平台 v1.2
                    </span>
                  </div>
                )}
              </div>

              {/* 导航 */}
              <ScrollArea className="flex-1 py-3">
                <nav className="flex flex-col gap-4 px-2" aria-label="主导航">
                  {navSections.map((section) => (
                    <div key={section.title}>
                      {!sidebarCollapsed && (
                        <div className="mb-1.5 px-2">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">
                            {section.title}
                          </span>
                        </div>
                      )}
                      <div className="flex flex-col gap-0.5">
                        {section.items.map((item) => {
                          const active = isNavActive(item.href, pathname)
                          const link = (
                            <Link
                              href={item.href}
                              aria-current={active ? "page" : undefined}
                              className={cn(
                                "group relative flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] transition-all",
                                active
                                  ? "bg-[hsl(199,89%,48%)]/10 font-medium text-status-info"
                                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                              )}
                            >
                              {active && (
                                <span
                                  className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-r-full bg-[hsl(199,89%,48%)]"
                                  aria-hidden="true"
                                />
                              )}
                              <item.icon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                              {sidebarCollapsed ? (
                                <span className="sr-only">{item.label}</span>
                              ) : (
                                <>
                                  <span className="flex-1 whitespace-nowrap text-left">{item.label}</span>
                                  {item.badge && (
                                    <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[hsl(0,72%,51%)] text-[10px] font-medium text-white">
                                      {item.badge}
                                    </span>
                                  )}
                                </>
                              )}
                            </Link>
                          )

                          if (sidebarCollapsed) {
                            return (
                              <Tooltip key={item.href}>
                                <TooltipTrigger asChild>{link}</TooltipTrigger>
                                <TooltipContent side="right" className="text-xs">
                                  {item.label}
                                  {item.badge && (
                                    <Badge className="ml-2 h-4 bg-[hsl(0,72%,51%)] px-1 text-[9px] text-white">
                                      {item.badge}
                                    </Badge>
                                  )}
                                </TooltipContent>
                              </Tooltip>
                            )
                          }
                          return <div key={item.href}>{link}</div>
                        })}
                      </div>
                    </div>
                  ))}
                </nav>
              </ScrollArea>

              {/* 折叠开关 */}
              <div className="border-t border-sidebar-border p-2">
                <button
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  aria-label={sidebarCollapsed ? "展开侧边栏" : "收起侧边栏"}
                  aria-expanded={!sidebarCollapsed}
                  className="flex w-full items-center justify-center rounded-md py-2 text-sidebar-foreground/50 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                >
                  <ChevronLeft
                    className={cn("h-4 w-4 transition-transform duration-300", sidebarCollapsed && "rotate-180")}
                    aria-hidden="true"
                  />
                </button>
              </div>
            </aside>

            {/* 主内容区 */}
            <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
              {/* 顶栏 */}
              <header className="flex h-14 flex-shrink-0 items-center justify-between border-b border-border bg-card/80 px-5 backdrop-blur-sm">
                <nav className="flex min-w-0 items-center gap-1 text-sm" aria-label="面包屑">
                  {crumbs.map((crumb, i) => {
                    const isLast = i === crumbs.length - 1
                    return (
                      <div key={`${crumb.label}-${i}`} className="flex min-w-0 items-center gap-1">
                        {crumb.href && !isLast ? (
                          <>
                            <Link
                              href={crumb.href}
                              className="text-muted-foreground transition-colors hover:text-foreground"
                            >
                              {crumb.label}
                            </Link>
                            <ChevronRight
                              className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground/50"
                              aria-hidden="true"
                            />
                          </>
                        ) : (
                          <span className="truncate font-medium text-foreground" aria-current="page">
                            {crumb.label}
                          </span>
                        )}
                      </div>
                    )
                  })}
                </nav>

                <div className="flex items-center gap-3">
                  {/* 快速搜索 */}
                  <div className="relative hidden lg:block">
                    <Search
                      className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <Input
                      placeholder="搜索项目、流水线、构建..."
                      aria-label="全局搜索"
                      onKeyDown={(e) => {
                        if (e.nativeEvent.isComposing || e.keyCode === 229) return
                        if (e.key === "Enter") {
                          const q = (e.target as HTMLInputElement).value.trim()
                          if (q) router.push(`/builds?search=${encodeURIComponent(q)}`)
                        }
                      }}
                      className="h-8 w-52 border-transparent bg-secondary/50 pl-8 text-xs transition-colors focus:border-border focus:bg-background"
                    />
                  </div>

                  {/* 品牌筛选 */}
                  <Select value={brand} onValueChange={setBrand}>
                    <SelectTrigger
                      aria-label="按品牌筛选"
                      className="h-8 w-28 border-transparent bg-secondary/50 text-xs transition-colors hover:border-border"
                    >
                      <SelectValue placeholder="选择品牌" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部品牌</SelectItem>
                      <SelectItem value="Qiyuan">启源</SelectItem>
                      <SelectItem value="Gravity">引力</SelectItem>
                      <SelectItem value="DeepBlue">深蓝</SelectItem>
                      <SelectItem value="TopSpace">TopSpace</SelectItem>
                    </SelectContent>
                  </Select>

                  <ThemeToggle />

                  {/* 通知 */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className="relative rounded-md p-2 transition-colors hover:bg-secondary"
                        aria-label={
                          unreadCount > 0 ? `通知，有 ${unreadCount} 条失败构建待关注` : "通知"
                        }
                      >
                        <Bell className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                        {unreadCount > 0 && (
                          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[hsl(0,72%,51%)] px-1 text-[9px] font-medium text-white ring-2 ring-card">
                            {unreadCount > 9 ? "9+" : unreadCount}
                          </span>
                        )}
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-80 p-0">
                      <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
                        <span className="text-sm font-medium text-foreground">构建动态</span>
                        {unreadCount > 0 && (
                          <span className="rounded-full bg-accent-danger px-2 py-0.5 text-[10px] font-medium text-status-danger">
                            {unreadCount} 条失败
                          </span>
                        )}
                      </div>
                      {notifications.length === 0 ? (
                        <div className="px-3 py-8 text-center text-xs text-muted-foreground">
                          暂无最新构建动态
                        </div>
                      ) : (
                        <div className="max-h-80 overflow-auto py-1">
                          {notifications.map((b) => {
                            const meta = STATUS_ICON[b.status] ?? STATUS_ICON.pending
                            return (
                              <Link
                                key={b.id}
                                href={`/builds/${b.id}`}
                                className="flex items-start gap-2.5 px-3 py-2.5 transition-colors hover:bg-secondary"
                              >
                                <meta.icon
                                  className={cn("mt-0.5 h-4 w-4 flex-shrink-0", meta.className, meta.spin && "animate-spin")}
                                  aria-hidden="true"
                                />
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5">
                                    <span className="truncate text-xs font-medium text-foreground">
                                      {b.pipeline} #{b.number}
                                    </span>
                                    <span className={cn("flex-shrink-0 text-[10px]", meta.className)}>
                                      {BUILD_STATUS_LABELS[b.status]}
                                    </span>
                                  </div>
                                  <div className="mt-0.5 truncate text-[11px] text-muted-foreground">
                                    {b.project} · {b.branch}
                                  </div>
                                  <div className="mt-0.5 text-[10px] text-muted-foreground/70">{b.time}</div>
                                </div>
                              </Link>
                            )
                          })}
                        </div>
                      )}
                      <DropdownMenuSeparator className="my-0" />
                      <Link
                        href="/builds"
                        className="block px-3 py-2.5 text-center text-xs font-medium text-status-info transition-colors hover:bg-secondary"
                      >
                        查看全部构建记录
                      </Link>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* 用户菜单 */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className="flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-secondary"
                        aria-label="用户菜单"
                      >
                        <Avatar className="h-7 w-7">
                          <AvatarFallback className="bg-gradient-to-br from-[hsl(199,89%,48%)]/30 to-[hsl(199,89%,48%)]/10 text-xs font-medium text-status-info">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="hidden text-left md:block">
                          <span className="block text-xs font-medium leading-tight text-foreground">{displayName}</span>
                          <span className="block text-[10px] leading-tight text-muted-foreground">{roleLabel}</span>
                        </div>
                        <ChevronDown className="hidden h-3 w-3 text-muted-foreground md:block" aria-hidden="true" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52">
                      <div className="mb-1 border-b border-border px-3 py-2">
                        <div className="text-sm font-medium text-foreground">{displayName}</div>
                        <div className="text-xs text-muted-foreground">{session?.email ?? ""}</div>
                      </div>
                      <DropdownMenuItem>
                        <User className="mr-2 h-4 w-4" aria-hidden="true" />
                        个人信息
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Settings className="mr-2 h-4 w-4" aria-hidden="true" />
                        系统设置
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={handleLogout}
                        disabled={loggingOut}
                        className="text-status-danger"
                      >
                        <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
                        {loggingOut ? "正在退出..." : "退出登录"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </header>

              {/* 页面内容 */}
              <main className="flex-1 overflow-auto">{children}</main>
            </div>
          </div>
        </PageHeaderContext.Provider>
      </BrandContext.Provider>
    </TooltipProvider>
  )
}
