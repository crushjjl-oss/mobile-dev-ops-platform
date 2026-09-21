import { handleRoute } from "@/lib/api-helpers"
import { getBuildStats } from "@/lib/data/repository"

export async function GET() {
  return handleRoute(() => getBuildStats())
}
