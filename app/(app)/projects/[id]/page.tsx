import { ProjectDetailPage } from "@/components/pages/project-detail-page"

/** Next.js 16：动态参数为异步，必须 await */
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <ProjectDetailPage projectId={id} />
}
