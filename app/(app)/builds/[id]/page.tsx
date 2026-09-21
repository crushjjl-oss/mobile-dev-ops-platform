import { BuildDetailPage } from "@/components/pages/build-detail-page"

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <BuildDetailPage buildId={id} />
}
