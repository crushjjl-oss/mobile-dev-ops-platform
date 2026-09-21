import type { Metadata } from "next"
import { Suspense } from "react"

import { LoginPage } from "@/components/pages/login-page"

export const metadata: Metadata = { title: "登录 | 智能构建平台" }

export default function Page() {
  return (
    <Suspense
      fallback={
        <div
          role="status"
          className="min-h-screen flex items-center justify-center bg-[hsl(var(--login-bg))] text-muted-foreground"
        >
          正在加载登录页面…
        </div>
      }
    >
      <LoginPage />
    </Suspense>
  )
}
