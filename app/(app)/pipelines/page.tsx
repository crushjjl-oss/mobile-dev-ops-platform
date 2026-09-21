import type { Metadata } from "next"

import { PipelineListPage } from "@/components/pages/pipeline-list-page"

export const metadata: Metadata = { title: "流水线管理 | 智能构建平台" }

export default function Page() {
  return <PipelineListPage />
}
