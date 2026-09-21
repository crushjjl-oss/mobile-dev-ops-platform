import type { Metadata } from "next"

import { ReportsPage } from "@/components/pages/reports-page"

export const metadata: Metadata = { title: "报告中心 | 智能构建平台" }

export default function Page() {
  return <ReportsPage />
}
