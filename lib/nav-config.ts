/**
 * 导航配置 —— 侧边栏、面包屑、页面标题的唯一来源
 *
 * 新增页面时只需在此处登记，侧边栏与面包屑会自动同步。
 */

import {
  LayoutDashboard,
  FolderKanban,
  GitBranch,
  Boxes,
  Package,
  ShieldCheck,
  Rocket,
  FileText,
  MonitorSmartphone,
  History,
  Layers,
  Briefcase,
} from "lucide-react"

export interface NavItem {
  href: string
  label: string
  icon: typeof LayoutDashboard
  badge?: string
}

export interface NavSection {
  title: string
  items: NavItem[]
}

export const navSections: NavSection[] = [
  {
    title: "概览",
    items: [
      { href: "/dashboard", label: "总览看板", icon: LayoutDashboard },
      { href: "/workbench", label: "工作台", icon: Briefcase },
    ],
  },
  {
    title: "CI/CD 流水线",
    items: [
      { href: "/projects", label: "项目管理", icon: FolderKanban },
      { href: "/pipelines", label: "流水线管理", icon: GitBranch },
      { href: "/builds", label: "构建记录", icon: Package },
      { href: "/templates", label: "流水线模板", icon: MonitorSmartphone },
    ],
  },
  {
    title: "组版发布",
    items: [
      { href: "/components", label: "组件管理", icon: Boxes },
      { href: "/integrations", label: "版本发布", icon: Layers },
    ],
  },
  {
    title: "质量与发布",
    items: [
      { href: "/quality", label: "质量门禁", icon: ShieldCheck, badge: "2" },
      { href: "/releases", label: "发布管理", icon: Rocket },
    ],
  },
  {
    title: "系统",
    items: [
      { href: "/reports", label: "报告中心", icon: FileText },
      { href: "/audit", label: "审计日志", icon: History },
    ],
  },
]

export const allNavItems = navSections.flatMap((s) => s.items)

/**
 * 判断导航项是否处于激活态。
 * 详情页（如 /builds/1284）应让其列表页（/builds）保持高亮。
 */
export function isNavActive(href: string, pathname: string): boolean {
  if (pathname === href) return true
  return pathname.startsWith(href + "/")
}

/** 由路径推导侧边栏所属的一级导航标签 */
export function findNavLabel(pathname: string): string | undefined {
  const match = allNavItems.find((item) => isNavActive(item.href, pathname))
  return match?.label
}

export interface Crumb {
  label: string
  /** 末级面包屑无链接 */
  href?: string
}

/** 详情页在无动态标题时的兜底名称 */
const detailFallback: Record<string, string> = {
  "/projects": "项目详情",
  "/pipelines": "流水线详情",
  "/builds": "构建详情",
  "/integrations": "版本详情",
}

/**
 * 由路径推导面包屑。
 * @param pathname 当前路径
 * @param dynamicTitle 详情页通过 usePageTitle 注入的真实名称（如「构建 #1284」）
 */
export function buildBreadcrumb(pathname: string, dynamicTitle?: string | null): Crumb[] {
  const parent = allNavItems.find((item) => isNavActive(item.href, pathname))
  if (!parent) return [{ label: "总览看板" }]

  // 列表页：单级面包屑
  if (pathname === parent.href) return [{ label: parent.label }]

  // 详情页：父级可点击 + 末级为具体对象名
  return [
    { label: parent.label, href: parent.href },
    { label: dynamicTitle ?? detailFallback[parent.href] ?? "详情" },
  ]
}
