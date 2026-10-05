import { defineWidgetConfig } from "@medusajs/admin-sdk"
import type { DetailWidgetProps, AdminProduct } from "@medusajs/framework/types"
import { Button, Container, Heading, Input, Label, Text, Textarea, toast } from "@medusajs/ui"
import { useState } from "react"

/**
 * Fabric & quality — what the storefront shows under "Fabric & care".
 * Stored in product.metadata so no migration is needed; keys match the
 * storefront's DETAIL_LABELS (apps/storefront/.../product-tabs).
 */
const FIELDS = [
  { key: "fabric", label: "Fabric", placeholder: "100% Supima cotton" },
  { key: "weave", label: "Weave / technique", placeholder: "Single jersey, Kanjivaram, hand chikankari…" },
  { key: "gsm", label: "GSM", placeholder: "180" },
  { key: "fit", label: "Fit / dimensions", placeholder: "Regular · 5.5 m + 0.8 m blouse piece" },
  { key: "origin", label: "Made in", placeholder: "Tiruppur, Tamil Nadu" },
  { key: "model_size", label: "Model", placeholder: "Model is 5'7\" and wears S" },
  { key: "care", label: "Care", placeholder: "Machine wash cold, dry in shade", multiline: true },
] as const

type Values = Record<(typeof FIELDS)[number]["key"], string>

const read = (meta: Record<string, unknown> | null | undefined): Values =>
  Object.fromEntries(FIELDS.map((f) => [f.key, typeof meta?.[f.key] === "string" ? (meta[f.key] as string) : ""])) as Values

const ProductFabricWidget = ({ data: product }: DetailWidgetProps<AdminProduct>) => {
  const [editing, setEditing] = useState(false)
  const [saved, setSaved] = useState<Values>(read(product.metadata))
  const [values, setValues] = useState<Values>(saved)
  const [saving, setSaving] = useState(false)
  const filled = FIELDS.filter((f) => saved[f.key]).length

  const save = async () => {
    setSaving(true)
    try {
      // Empty strings are stored as "" — the storefront hides empty rows.
      const res = await fetch(`/admin/products/${product.id}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metadata: { ...(product.metadata ?? {}), ...values } }),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message ?? res.statusText)
      setSaved(values)
      setEditing(false)
      toast.success("Fabric details saved", { description: "Live on the product page within a minute." })
    } catch (e) {
      toast.error("Could not save", { description: (e as Error).message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h2">Fabric & quality</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            {filled}/{FIELDS.length} details filled · shown to customers
          </Text>
        </div>
        {!editing && (
          <Button size="small" variant="secondary" onClick={() => { setValues(saved); setEditing(true) }}>
            Edit
          </Button>
        )}
      </div>

      {editing ? (
        <div className="flex flex-col gap-y-4 px-6 py-4">
          {FIELDS.map((f) => (
            <div key={f.key} className="flex flex-col gap-y-1">
              <Label size="small" htmlFor={`fabric-${f.key}`}>{f.label}</Label>
              {"multiline" in f ? (
                <Textarea
                  id={`fabric-${f.key}`}
                  value={values[f.key]}
                  placeholder={f.placeholder}
                  onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                />
              ) : (
                <Input
                  id={`fabric-${f.key}`}
                  size="small"
                  value={values[f.key]}
                  placeholder={f.placeholder}
                  onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                />
              )}
            </div>
          ))}
          <div className="flex justify-end gap-x-2">
            <Button size="small" variant="secondary" onClick={() => setEditing(false)} disabled={saving}>
              Cancel
            </Button>
            <Button size="small" onClick={save} isLoading={saving}>
              Save
            </Button>
          </div>
        </div>
      ) : (
        FIELDS.map((f) => (
          <div key={f.key} className="grid grid-cols-[110px_1fr] gap-x-3 px-6 py-3">
            <Text size="small" weight="plus" className="text-ui-fg-subtle">{f.label}</Text>
            <Text size="small" className={saved[f.key] ? "" : "text-ui-fg-muted"}>
              {saved[f.key] || "—"}
            </Text>
          </div>
        ))
      )}
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details.side.after",
})

export default ProductFabricWidget
