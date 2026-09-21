import { handleRoute, requireSession } from "@/lib/api-helpers"
import { createIntegrationComponent, listIntegrationComponents } from "@/lib/data/repository"
import { createComponentSchema, parseBody } from "@/lib/validation"

export async function GET() {
  return handleRoute(() => listIntegrationComponents())
}

export async function POST(request: Request) {
  return handleRoute(async () => {
    // 操作人取自服务端会话，不信任客户端传入的身份字段，保证审计记录真实可靠。
    const session = await requireSession()
    const body = await parseBody(request, createComponentSchema)
    return createIntegrationComponent({
      key: body.key,
      name: body.name,
      type: body.type,
      pipelineId: body.pipelineId,
      projectId: body.projectId ?? "",
      description: body.description,
      operator: session.displayName,
    })
  })
}
