import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000
const DAY_MS = 24 * 60 * 60 * 1000

/** Start of "today" in India, as a UTC Date. */
function startOfIstDay(now = Date.now()) {
  return new Date(Math.floor((now + IST_OFFSET_MS) / DAY_MS) * DAY_MS - IST_OFFSET_MS)
}

type Bucket = { orders: number; revenue: number; cod: number; prepaid: number }
const empty = (): Bucket => ({ orders: 0, revenue: 0, cod: 0, prepaid: 0 })

/**
 * GET /admin/sales-summary
 * Today (IST) and last-7-days order counts, revenue (₹, GST-inclusive),
 * COD vs prepaid split and orders still waiting to be shipped.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const today = startOfIstDay()
  const weekStart = new Date(today.getTime() - 6 * DAY_MS)

  const { data: orders } = await query.graph({
    entity: "order",
    fields: [
      "id",
      "created_at",
      "canceled_at",
      "status",
      "total",
      "currency_code",
      "fulfillments.id",
      "payment_collections.payment_sessions.provider_id",
    ],
    filters: { created_at: { $gte: weekStart } },
  })

  const t = empty()
  const w = empty()
  let toShip = 0
  const daily = new Map<string, number>()

  for (const o of orders as any[]) {
    if (o.canceled_at || o.status === "canceled" || o.status === "draft") continue
    const total = Number(o.total ?? 0)
    const providers: string[] = (o.payment_collections ?? []).flatMap((pc: any) =>
      (pc?.payment_sessions ?? []).map((s: any) => s?.provider_id)
    )
    const isCod = providers.length === 0 || providers.some((p) => p?.startsWith("pp_system"))
    const created = new Date(o.created_at)

    for (const b of created >= today ? [t, w] : [w]) {
      b.orders++
      b.revenue += total
      isCod ? b.cod++ : b.prepaid++
    }
    if (!o.fulfillments?.length) toShip++
    const day = new Date(created.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10)
    daily.set(day, (daily.get(day) ?? 0) + total)
  }

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart.getTime() + i * DAY_MS + IST_OFFSET_MS).toISOString().slice(0, 10)
    return { date: d, revenue: daily.get(d) ?? 0 }
  })

  res.json({
    currency_code: "inr",
    today: t,
    week: { ...w, avg_order_value: w.orders ? Math.round(w.revenue / w.orders) : 0 },
    awaiting_shipment: toShip,
    days,
  })
}
