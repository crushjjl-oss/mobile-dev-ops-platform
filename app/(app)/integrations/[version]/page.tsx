import type { Metadata } from "next"

import { VersionReleaseDetailPage } from "@/components/pages/version-release-detail-page"

export const metadata: Metadata = { title: "版本详情 | 智能构建平台" }

export default async function Page({ params }: { params: Promise<{ version: string }> }) {
  const { version } = await params
  return <VersionReleaseDetailPage version={decodeURIComponent(version)} />
}
