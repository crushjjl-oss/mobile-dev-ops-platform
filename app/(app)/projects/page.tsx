import type { Metadata } from "next"

import { ProjectListPage } from "@/components/pages/project-list-page"

export const metadata: Metadata = { title: "项目管理 | 智能构建平台" }

export default function Page() {
  return <ProjectListPage />
}
