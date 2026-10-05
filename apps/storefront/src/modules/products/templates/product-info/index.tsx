import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type ProductInfoProps = {
  product: HttpTypes.StoreProduct
}

const ProductInfo = ({ product }: ProductInfoProps) => {
  const fabric = (product.metadata?.fabric as string | undefined) ?? product.material

  return (
    <div id="product-info" className="flex flex-col gap-y-2">
      {product.collection && (
        <LocalizedClientLink href={`/collections/${product.collection.handle}`} className="eyebrow hover:text-maroon w-fit">
          {product.collection.title}
        </LocalizedClientLink>
      )}
      <h1 className="font-display text-[34px] small:text-[42px] leading-[1.05] font-semibold text-ink" data-testid="product-title">
        {product.title}
      </h1>
      {product.subtitle && <p className="text-[15px] text-ink-soft">{product.subtitle}</p>}
      {fabric && (
        <p className="mt-1 inline-flex w-fit items-center gap-2 rounded-full border border-sand-dark bg-white px-3 py-1 text-[12px] text-ink-soft">
          <span className="h-1.5 w-1.5 rounded-full bg-gold" /> {fabric}
        </p>
      )}
    </div>
  )
}

export default ProductInfo
