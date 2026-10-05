import { listProducts } from "@lib/data/products"
import { HttpTypes } from "@medusajs/types"
import { SectionHeader } from "@modules/home/components/sections"
import ProductPreview from "@modules/products/components/product-preview"

/** A collection as a row of cards: swipeable on phones, a 4-up grid on desktop. */
export default async function ProductRail({
  collection,
  region,
  eyebrow,
  limit = 8,
}: {
  collection: HttpTypes.StoreCollection
  region: HttpTypes.StoreRegion
  eyebrow?: string
  limit?: number
}) {
  const {
    response: { products },
  } = await listProducts({
    regionId: region.id,
    queryParams: {
      collection_id: collection.id,
      limit,
      fields: "*variants.calculated_price",
    },
  })

  if (!products?.length) {
    return null
  }

  return (
    <section className="content-container py-12 small:py-16">
      <SectionHeader eyebrow={eyebrow} title={collection.title} href={`/collections/${collection.handle}`} />
      <ul className="-mx-6 px-6 flex small:grid small:grid-cols-4 gap-4 small:gap-x-6 small:gap-y-12 overflow-x-auto small:overflow-visible snap-x snap-mandatory no-scrollbar">
        {products.map((product) => (
          <li key={product.id} className="w-[62%] xsmall:w-[40%] small:w-auto shrink-0 snap-start">
            <ProductPreview product={product} region={region} />
          </li>
        ))}
      </ul>
    </section>
  )
}
