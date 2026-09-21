import type { Metadata } from "next"

import { ComponentManagementPage } from "@/components/pages/component-management-page"

export const metadata: Metadata = { title: "组件管理 | 智能构建平台" }

export default function Page() {
  return <ComponentManagementPage />
}
