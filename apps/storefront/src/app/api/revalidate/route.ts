import { revalidateTag } from "next/cache"
import { NextRequest, NextResponse } from "next/server"

/** Catalogue-level cache tags the backend may bust. Per-user data (carts, orders) is never listed. */
const ALLOWED = new Set(["products", "variants", "categories", "collections", "regions"])

/**
 * POST /api/revalidate  { "tags": ["products"] }
 * Called by the Medusa subscriber (apps/backend/src/subscribers/revalidate-storefront.ts)
 * with the shared REVALIDATE_SECRET, so admin edits reach shoppers in seconds.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET
  if (!secret || req.headers.get("x-revalidate-secret") !== secret) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  const body = (await req.json().catch(() => ({}))) as { tags?: unknown }
  const tags = (Array.isArray(body.tags) ? body.tags : ["products"]).filter(
    (t): t is string => typeof t === "string" && ALLOWED.has(t)
  )

  tags.forEach((t) => revalidateTag(t))
  return NextResponse.json({ ok: true, revalidated: tags })
}
