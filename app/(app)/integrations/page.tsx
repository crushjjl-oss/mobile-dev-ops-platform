import type { Metadata } from "next"

import { VersionReleaseListPage } from "@/components/pages/version-release-list-page"

export const metadata: Metadata = { title: "版本发布 | 智能构建平台" }

export default function Page() {
  return <VersionReleaseListPage />
}
