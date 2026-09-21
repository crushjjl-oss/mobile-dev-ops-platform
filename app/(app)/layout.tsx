import type { ReactNode } from "react"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { AppShell } from "@/components/layout/app-shell"
import { SESSION_COOKIE } from "@/lib/session"

/**
 * 已登录区布局。
 *
 * 服务端校验会话后再渲染，避免未登录内容闪现（客户端守卫做不到这点）。
 * proxy.ts 已在边缘拦截，这里是第二道防线：直接访问 RSC 时同样生效。
 */
export default async function AuthenticatedLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies()
  if (!cookieStore.get(SESSION_COOKIE)) {
    redirect("/login")
  }

  return <AppShell>{children}</AppShell>
}
