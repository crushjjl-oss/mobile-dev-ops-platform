import type { Metadata } from "next"

import { TemplatePage } from "@/components/pages/template-page"

export const metadata: Metadata = { title: "流水线模板 | 智能构建平台" }

export default function Page() {
  return <TemplatePage />
}
