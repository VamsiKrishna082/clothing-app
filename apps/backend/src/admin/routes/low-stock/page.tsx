import { defineRouteConfig } from "@medusajs/admin-sdk"
import { ExclamationCircle } from "@medusajs/icons"
import { Badge, Container, Heading, Select, Table, Text } from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { Link } from "react-router-dom"

type Row = {
  inventory_item_id: string
  sku: string | null
  product_id: string | null
  product_title: string | null
  variant_title: string | null
  thumbnail: string | null
  stocked: number
  reserved: number
  available: number
}

/** Every SKU running low, so restocking never depends on someone noticing. */
const LowStockPage = () => {
  const [threshold, setThreshold] = useState("5")
  const { data, isLoading, isError } = useQuery<{ count: number; rows: Row[] }>({
    queryKey: ["tharam-low-stock", threshold],
    queryFn: async () => {
      const res = await fetch(`/admin/low-stock?threshold=${threshold}`, { credentials: "include" })
      if (!res.ok) throw new Error(res.statusText)
      return res.json()
    },
  })

  return (
    <Container className="divide-y p-0">
      <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4">
        <div>
          <Heading level="h1">Low stock</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            SKUs with available stock (stocked − reserved for open orders) at or below the threshold.
          </Text>
        </div>
        <div className="flex items-center gap-2">
          <Text size="small" className="text-ui-fg-subtle">Show at or below</Text>
          <div className="w-24">
            <Select value={threshold} onValueChange={setThreshold} size="small">
              <Select.Trigger>
                <Select.Value />
              </Select.Trigger>
              <Select.Content>
                {["0", "2", "5", "10", "20"].map((v) => (
                  <Select.Item key={v} value={v}>{v}</Select.Item>
                ))}
              </Select.Content>
            </Select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <Text className="px-6 py-6 text-ui-fg-muted">Loading…</Text>
      ) : isError || !data ? (
        <Text className="px-6 py-6 text-ui-fg-error">Couldn't load stock levels.</Text>
      ) : data.rows.length === 0 ? (
        <Text className="px-6 py-10 text-center text-ui-fg-subtle">All good — nothing at or below {threshold}.</Text>
      ) : (
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Product</Table.HeaderCell>
              <Table.HeaderCell>Variant</Table.HeaderCell>
              <Table.HeaderCell>SKU</Table.HeaderCell>
              <Table.HeaderCell className="text-right">Stocked</Table.HeaderCell>
              <Table.HeaderCell className="text-right">Reserved</Table.HeaderCell>
              <Table.HeaderCell className="text-right">Available</Table.HeaderCell>
              <Table.HeaderCell />
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {data.rows.map((r) => (
              <Table.Row key={`${r.inventory_item_id}`}>
                <Table.Cell>
                  <div className="flex items-center gap-3">
                    {r.thumbnail && <img src={r.thumbnail} alt="" className="h-10 w-8 rounded object-cover" />}
                    {r.product_id ? (
                      <Link to={`/products/${r.product_id}`} className="text-ui-fg-interactive hover:underline">
                        {r.product_title}
                      </Link>
                    ) : (
                      r.product_title ?? "—"
                    )}
                  </div>
                </Table.Cell>
                <Table.Cell>{r.variant_title ?? "—"}</Table.Cell>
                <Table.Cell className="font-mono text-xs">{r.sku ?? "—"}</Table.Cell>
                <Table.Cell className="text-right">{r.stocked}</Table.Cell>
                <Table.Cell className="text-right">{r.reserved}</Table.Cell>
                <Table.Cell className="text-right">
                  <Badge size="2xsmall" color={r.available <= 0 ? "red" : r.available <= 2 ? "orange" : "grey"}>
                    {r.available <= 0 ? "Out of stock" : r.available}
                  </Badge>
                </Table.Cell>
                <Table.Cell className="text-right">
                  <Link to={`/inventory/${r.inventory_item_id}`} className="text-ui-fg-interactive text-sm hover:underline">
                    Restock →
                  </Link>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      )}
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Low stock",
  icon: ExclamationCircle,
})

export default LowStockPage
