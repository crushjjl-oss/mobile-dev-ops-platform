import { handleRoute } from "@/lib/api-helpers"
import { getBuild } from "@/lib/data/repository"

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return handleRoute(() => getBuild(id))
}
