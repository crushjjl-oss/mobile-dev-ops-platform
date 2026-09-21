import type { Metadata } from "next"

import { AuditLogPage } from "@/components/pages/audit-log-page"

export const metadata: Metadata = { title: "审计日志 | 智能构建平台" }

export default function Page() {
  return <AuditLogPage />
}
