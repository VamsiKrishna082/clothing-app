import { getProductPrice } from "@lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"

export default function ProductPrice({
  product,
  variant,
}: {
  product: HttpTypes.StoreProduct
  variant?: HttpTypes.StoreProductVariant
}) {
  const { cheapestPrice, variantPrice } = getProductPrice({
    product,
    variantId: variant?.id,
  })

  const selectedPrice = variant ? variantPrice : cheapestPrice

  if (!selectedPrice) {
    return <div className="block w-32 h-9 bg-sand animate-pulse rounded" />
  }

  const onSale = selectedPrice.price_type === "sale"

  return (
    <div>
      <div className="flex items-baseline flex-wrap gap-x-3 gap-y-1">
        <span
          className={`text-[26px] font-bold ${onSale ? "text-maroon" : "text-ink"}`}
          data-testid="product-price"
          data-value={selectedPrice.calculated_price_number}
        >
          {selectedPrice.calculated_price}
        </span>
        {onSale && (
          <>
            <span
              className="text-base text-ink-muted line-through"
              data-testid="original-product-price"
              data-value={selectedPrice.original_price_number}
            >
              MRP {selectedPrice.original_price}
            </span>
            <span className="rounded-full bg-maroon-light px-2.5 py-0.5 text-[12px] font-bold text-maroon">
              {selectedPrice.percentage_diff}% off
            </span>
          </>
        )}
      </div>
      <p className="mt-1 text-[12px] text-ink-muted">Inclusive of all taxes</p>
    </div>
  )
}
