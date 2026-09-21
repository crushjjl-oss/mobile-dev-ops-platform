import { handleRoute } from "@/lib/api-helpers"
import { getDashboard } from "@/lib/data/repository"

export async function GET() {
  return handleRoute(() => getDashboard())
}
