import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export type LowStockRow = {
  inventory_item_id: string
  sku: string | null
  product_id: string | null
  product_title: string | null
  variant_title: string | null
  thumbnail: string | null
  location_id: string
  stocked: number
  reserved: number
  available: number
}

/**
 * GET /admin/low-stock?threshold=5
 * SKUs whose available quantity (stocked − reserved) at a location is at or below
 * the threshold, lowest first. Admin routes are authenticated by Medusa.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const threshold = Math.max(0, Number(req.query.threshold ?? 5) || 5)

  const { data: levels } = await query.graph({
    entity: "inventory_level",
    fields: [
      "inventory_item_id",
      "location_id",
      "stocked_quantity",
      "reserved_quantity",
      "inventory_item.sku",
      "inventory_item.variants.title",
      "inventory_item.variants.product.id",
      "inventory_item.variants.product.title",
      "inventory_item.variants.product.thumbnail",
    ],
  })

  const rows: LowStockRow[] = levels
    .map((l: any) => {
      const variant = l.inventory_item?.variants?.[0]
      const stocked = Number(l.stocked_quantity ?? 0)
      const reserved = Number(l.reserved_quantity ?? 0)
      return {
        inventory_item_id: l.inventory_item_id,
        sku: l.inventory_item?.sku ?? null,
        product_id: variant?.product?.id ?? null,
        product_title: variant?.product?.title ?? null,
        variant_title: variant?.title ?? null,
        thumbnail: variant?.product?.thumbnail ?? null,
        location_id: l.location_id,
        stocked,
        reserved,
        available: stocked - reserved,
      }
    })
    .filter((r) => r.available <= threshold)
    .sort((a, b) => a.available - b.available || (a.product_title ?? "").localeCompare(b.product_title ?? ""))

  res.json({ threshold, count: rows.length, rows })
}
