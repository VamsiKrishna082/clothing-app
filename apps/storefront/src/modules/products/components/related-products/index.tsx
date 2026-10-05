import { listProducts } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import { HttpTypes } from "@medusajs/types"
import { SectionHeader } from "@modules/home/components/sections"
import Product from "../product-preview"

type RelatedProductsProps = {
  product: HttpTypes.StoreProduct
  countryCode: string
}

/** Four products from the same category (falling back to the same collection). */
export default async function RelatedProducts({ product, countryCode }: RelatedProductsProps) {
  const region = await getRegion(countryCode)
  if (!region) {
    return null
  }

  const category = product.categories?.find((c) => c.parent_category_id) ?? product.categories?.[0]
  const queryParams: HttpTypes.StoreProductListParams = {
    region_id: region.id,
    is_giftcard: false,
    limit: 5,
    ...(category
      ? { category_id: [category.id] }
      : product.collection_id
      ? { collection_id: [product.collection_id] }
      : {}),
  }

  const products = await listProducts({ queryParams, countryCode }).then(({ response }) =>
    response.products.filter((p) => p.id !== product.id).slice(0, 4)
  )

  if (!products.length) {
    return null
  }

  return (
    <div>
      <SectionHeader
        eyebrow="Complete the look"
        title="You may also like"
        href={category ? `/categories/${category.handle}` : undefined}
        linkLabel={category ? `More ${category.name}` : undefined}
      />
      <ul className="grid grid-cols-2 small:grid-cols-4 gap-x-4 small:gap-x-6 gap-y-10">
        {products.map((p) => (
          <li key={p.id}>
            <Product region={region} product={p} />
          </li>
        ))}
      </ul>
    </div>
  )
}
