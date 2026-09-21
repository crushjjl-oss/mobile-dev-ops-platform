import type { Metadata } from "next"

import { ReleasePage } from "@/components/pages/release-page"

export const metadata: Metadata = { title: "发布管理 | 智能构建平台" }

export default function Page() {
  return <ReleasePage />
}
