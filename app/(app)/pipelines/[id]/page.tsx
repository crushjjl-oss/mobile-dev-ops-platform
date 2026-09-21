import { PipelineEditorPage } from "@/components/pages/pipeline-editor-page"

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <PipelineEditorPage pipelineId={id} />
}
