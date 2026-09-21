import type { Metadata } from "next"

import { LoginPage } from "@/components/pages/login-page"

export const metadata: Metadata = { title: "登录 | 智能构建平台" }

export default function Page() {
  return <LoginPage />
}
