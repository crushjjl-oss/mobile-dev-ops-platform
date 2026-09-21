import type { Metadata } from "next"

import { BuildHistoryPage } from "@/components/pages/build-history-page"

export const metadata: Metadata = { title: "构建记录 | 智能构建平台" }

export default function Page() {
  return <BuildHistoryPage />
}
