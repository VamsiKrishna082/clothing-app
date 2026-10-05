import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Text } from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"

type Bucket = { orders: number; revenue: number; cod: number; prepaid: number }
type Summary = {
  today: Bucket
  week: Bucket & { avg_order_value: number }
  awaiting_shipment: number
  days: { date: string; revenue: number }[]
}

const inr = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n)

const Stat = ({ label, value, hint }: { label: string; value: string; hint?: string }) => (
  <div className="flex flex-col gap-y-1 rounded-lg border border-ui-border-base bg-ui-bg-subtle px-4 py-3">
    <Text size="xsmall" className="text-ui-fg-muted uppercase tracking-wide">{label}</Text>
    <Text size="xlarge" weight="plus" className="text-ui-fg-base">{value}</Text>
    {hint && <Text size="xsmall" className="text-ui-fg-subtle">{hint}</Text>}
  </div>
)

/** Today / last 7 days at a glance, above the order list. */
const SalesSummaryWidget = () => {
  const { data, isLoading, isError } = useQuery<Summary>({
    queryKey: ["tharam-sales-summary"],
    queryFn: async () => {
      const res = await fetch("/admin/sales-summary", { credentials: "include" })
      if (!res.ok) throw new Error(res.statusText)
      return res.json()
    },
    refetchInterval: 60_000,
  })

  const max = Math.max(1, ...(data?.days ?? []).map((d) => d.revenue))

  return (
    <Container className="p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Sales at a glance</Heading>
        <Text size="small" className="text-ui-fg-muted">Today is IST · refreshes every minute</Text>
      </div>
      {isLoading ? (
        <Text size="small" className="px-6 pb-5 text-ui-fg-muted">Loading…</Text>
      ) : isError || !data ? (
        <Text size="small" className="px-6 pb-5 text-ui-fg-error">Couldn't load the summary.</Text>
      ) : (
        <div className="grid gap-4 px-6 pb-6 lg:grid-cols-[1fr_280px]">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label="Orders today" value={String(data.today.orders)} hint={`${data.today.cod} COD · ${data.today.prepaid} prepaid`} />
            <Stat label="Revenue today" value={inr(data.today.revenue)} />
            <Stat label="Last 7 days" value={inr(data.week.revenue)} hint={`${data.week.orders} orders · AOV ${inr(data.week.avg_order_value)}`} />
            <Stat label="To ship" value={String(data.awaiting_shipment)} hint="Orders without a fulfilment" />
          </div>
          <div className="rounded-lg border border-ui-border-base px-4 py-3">
            <Text size="xsmall" className="text-ui-fg-muted uppercase tracking-wide">Revenue, last 7 days</Text>
            <div className="mt-2 flex h-20 items-end gap-1.5" role="img" aria-label="Daily revenue for the last seven days">
              {data.days.map((d) => (
                <div key={d.date} className="group relative flex-1">
                  <div
                    className="w-full rounded-t-[4px] bg-ui-fg-interactive/80 transition-colors group-hover:bg-ui-fg-interactive"
                    style={{ height: `${Math.max(3, (d.revenue / max) * 80)}px` }}
                  />
                  <span className="pointer-events-none absolute -top-7 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-ui-bg-base px-1.5 py-0.5 text-[11px] shadow group-hover:block">
                    {d.date.slice(5)} · {inr(d.revenue)}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-1 flex justify-between text-[10px] text-ui-fg-muted">
              <span>{data.days[0]?.date.slice(5)}</span>
              <span>Today</span>
            </div>
          </div>
        </div>
      )}
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "order.list.before",
})

export default SalesSummaryWidget
