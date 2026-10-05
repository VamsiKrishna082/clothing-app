"use client"

import { BRAND } from "@lib/brand"
import { HttpTypes } from "@medusajs/types"
import { CashIcon, ReturnIcon, TruckIcon } from "@modules/common/icons/line"

import Accordion from "./accordion"

type ProductTabsProps = {
  product: HttpTypes.StoreProduct
}

/** Labels for the fabric & quality fields the admin widget stores in product metadata. */
const DETAIL_LABELS: [key: string, label: string][] = [
  ["fabric", "Fabric"],
  ["weave", "Weave / technique"],
  ["gsm", "GSM"],
  ["fit", "Fit / dimensions"],
  ["origin", "Made in"],
  ["model_size", "Model"],
  ["care", "Care"],
]

const ProductTabs = ({ product }: ProductTabsProps) => {
  const tabs = [
    { label: "Description", component: <DescriptionTab product={product} /> },
    { label: "Fabric & care", component: <FabricTab product={product} /> },
    { label: "Delivery & returns", component: <ShippingInfoTab /> },
  ]

  return (
    <div className="w-full border-t border-sand-dark">
      <Accordion type="multiple" defaultValue={["Description"]}>
        {tabs.map((tab) => (
          <Accordion.Item key={tab.label} title={tab.label} headingSize="medium" value={tab.label}>
            {tab.component}
          </Accordion.Item>
        ))}
      </Accordion>
    </div>
  )
}

const DescriptionTab = ({ product }: ProductTabsProps) => (
  <p className="pb-6 text-[14px] leading-relaxed text-ink-soft whitespace-pre-line" data-testid="product-description">
    {product.description}
  </p>
)

const FabricTab = ({ product }: ProductTabsProps) => {
  const meta = (product.metadata ?? {}) as Record<string, unknown>
  const rows = DETAIL_LABELS.map(([key, label]) => [label, meta[key]] as const).filter(
    ([, v]) => typeof v === "string" && v.trim()
  )
  if (!rows.length && product.material) rows.push(["Fabric", product.material])

  return (
    <dl className="pb-6 grid grid-cols-[120px_1fr] gap-x-4 gap-y-3 text-[13.5px]">
      {rows.length ? (
        rows.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-ink-muted">{label}</dt>
            <dd className="text-ink">{value as string}</dd>
          </div>
        ))
      ) : (
        <p className="col-span-2 text-ink-muted">Fabric details coming soon.</p>
      )}
    </dl>
  )
}

const ShippingInfoTab = () => (
  <ul className="pb-6 flex flex-col gap-4 text-[13.5px] text-ink-soft">
    <li className="flex gap-3">
      <TruckIcon className="text-gold shrink-0" />
      <span>
        <b className="text-ink">Dispatched in 24–48 hours.</b> Delivered in 3–6 days across India. Free above ₹{BRAND.freeShippingAbove}, otherwise ₹79.
      </span>
    </li>
    <li className="flex gap-3">
      <CashIcon className="text-gold shrink-0" />
      <span>
        <b className="text-ink">Cash on Delivery</b> available. UPI, cards and netbanking coming soon.
      </span>
    </li>
    <li className="flex gap-3">
      <ReturnIcon className="text-gold shrink-0" />
      <span>
        <b className="text-ink">{BRAND.returnDays}-day returns & exchanges</b> on unworn items with tags. Sarees with blouse piece cut are not returnable.
      </span>
    </li>
  </ul>
)

export default ProductTabs
