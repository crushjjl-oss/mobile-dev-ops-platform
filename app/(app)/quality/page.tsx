import type { Metadata } from "next"

import { QualityGatePage } from "@/components/pages/quality-gate-page"

export const metadata: Metadata = { title: "质量门禁 | 智能构建平台" }

export default function Page() {
  return <QualityGatePage />
}
