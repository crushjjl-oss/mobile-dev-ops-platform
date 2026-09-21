import { handleRoute, parseListQuery, requireSession } from "@/lib/api-helpers"
import { createIntegrationBaseline, listIntegrationBaselines } from "@/lib/data/repository"
import { createBaselineSchema, parseBody } from "@/lib/validation"

export async function GET(request: Request) {
  const query = parseListQuery(request.url)
  return handleRoute(() => listIntegrationBaselines(query))
}

export async function POST(request: Request) {
  return handleRoute(async () => {
    // 操作人取自服务端会话，不信任客户端传入的身份字段，保证审计记录真实可靠。
    const session = await requireSession()
    const body = await parseBody(request, createBaselineSchema)
    return createIntegrationBaseline({
      version: body.version,
      description: body.description,
      cloneFrom: body.sourceVersion,
      operator: session.displayName,
    })
  })
}
