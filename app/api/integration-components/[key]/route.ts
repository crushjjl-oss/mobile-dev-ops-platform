import { handleRoute, requireSession } from "@/lib/api-helpers"
import { setIntegrationComponentStatus, updateIntegrationComponent } from "@/lib/data/repository"
import { parseBody, updateComponentSchema } from "@/lib/validation"

export async function PATCH(request: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params
  return handleRoute(async () => {
    await requireSession()
    const body = await parseBody(request, updateComponentSchema)
    const decodedKey = decodeURIComponent(key)

    // 仅传 status 字段时按启停处理，否则按字段编辑处理。
    if (body.status !== undefined && Object.keys(body).length === 1) {
      return setIntegrationComponentStatus(decodedKey, body.status)
    }

    return updateIntegrationComponent(decodedKey, {
      name: body.name,
      type: body.type,
      pipelineId: body.pipelineId,
      projectId: body.projectId,
      description: body.description,
    })
  })
}
