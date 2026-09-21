import { handleRoute, parseListQuery } from "@/lib/api-helpers"
import { listReleases } from "@/lib/data/repository"

export async function GET(request: Request) {
  const query = parseListQuery(request.url)
  return handleRoute(() => listReleases(query))
}
