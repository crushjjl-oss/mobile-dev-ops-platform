import { handleRoute } from "@/lib/api-helpers"
import { getBaselineChangesets } from "@/lib/data/repository"

export async function GET(_request: Request, { params }: { params: Promise<{ version: string }> }) {
  const { version } = await params
  return handleRoute(() => getBaselineChangesets(decodeURIComponent(version)))
}
