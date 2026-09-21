import { handleRoute } from "@/lib/api-helpers"
import { getIntegrationBaseline } from "@/lib/data/repository"

export async function GET(_request: Request, { params }: { params: Promise<{ version: string }> }) {
  const { version } = await params
  return handleRoute(() => getIntegrationBaseline(decodeURIComponent(version)))
}
