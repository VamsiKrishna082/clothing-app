import { VariantPrice } from "types/global"

export default async function PreviewPrice({ price }: { price: VariantPrice }) {
  if (!price) {
    return null
  }

  const onSale = price.price_type === "sale"

  return (
    <>
      <span className={onSale ? "font-bold text-maroon" : "font-semibold text-ink"} data-testid="price">
        {price.calculated_price}
      </span>
      {onSale && (
        <span className="line-through text-ink-muted text-[12.5px]" data-testid="original-price">
          {price.original_price}
        </span>
      )}
    </>
  )
}
