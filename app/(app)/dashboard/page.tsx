import type { Metadata } from "next"

import { DashboardPage } from "@/components/pages/dashboard-page"

export const metadata: Metadata = { title: "总览看板 | 智能构建平台" }

export default function Page() {
  return <DashboardPage />
}
