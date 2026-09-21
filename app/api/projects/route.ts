import { handleRoute, parseListQuery } from "@/lib/api-helpers"
import { listProjects } from "@/lib/data/repository"

export async function GET(request: Request) {
  const query = parseListQuery(request.url)
  return handleRoute(() => listProjects(query))
}
