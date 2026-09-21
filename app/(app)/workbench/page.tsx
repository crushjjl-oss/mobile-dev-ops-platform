import type { Metadata } from "next"

import { WorkbenchPage } from "@/components/pages/workbench-page"

export const metadata: Metadata = { title: "工作台 | 智能构建平台" }

export default function Page() {
  return <WorkbenchPage />
}
