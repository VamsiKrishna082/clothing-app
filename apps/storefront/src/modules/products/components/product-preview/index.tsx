import { getProductPrice } from "@lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Image from "next/image"
import PlaceholderImage from "@modules/common/icons/placeholder-image"
import PreviewPrice from "./price"

export default async function ProductPreview({
  product,
  isFeatured,
  region: _region,
}: {
  product: HttpTypes.StoreProduct
  isFeatured?: boolean
  region: HttpTypes.StoreRegion
}) {
  const { cheapestPrice } = getProductPrice({ product })

  const first = product.thumbnail || product.images?.[0]?.url
  const second = product.images?.find((i) => i.url && i.url !== first)?.url
  const onSale = cheapestPrice?.price_type === "sale"
  const colours = product.options?.find((o) => /colou?r/i.test(o.title ?? ""))?.values?.length ?? 0

  return (
    <LocalizedClientLink href={`/products/${product.handle}`} className="group block" data-testid="product-wrapper">
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-sand">
        {first ? (
          <>
            <Image
              src={first}
              alt={product.title ?? "Product image"}
              fill
              sizes="(max-width: 512px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className={`object-cover object-top transition-all duration-700 ease-out group-hover:scale-[1.04] ${second ? "group-hover:opacity-0" : ""}`}
              priority={isFeatured}
            />
            {second && (
              <Image
                src={second}
                alt=""
                fill
                sizes="(max-width: 512px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-cover object-top opacity-0 transition-opacity duration-700 group-hover:opacity-100"
              />
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <PlaceholderImage size={24} />
          </div>
        )}
        {onSale && cheapestPrice?.percentage_diff && (
          <span className="absolute top-3 left-3 rounded-full bg-maroon px-2.5 py-1 text-[11px] font-bold text-white">
            {cheapestPrice.percentage_diff}% off
          </span>
        )}
        <span className="absolute inset-x-3 bottom-3 translate-y-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 hidden small:flex items-center justify-center h-10 rounded-full bg-ivory/95 text-[12px] font-semibold tracking-wide text-ink">
          View details
        </span>
      </div>
      <div className="mt-3 flex flex-col gap-0.5">
        <h3 className="text-[14px] small:text-[15px] font-semibold text-ink leading-snug line-clamp-1" data-testid="product-title">
          {product.title}
        </h3>
        {product.subtitle && <p className="text-[12.5px] text-ink-muted line-clamp-1">{product.subtitle}</p>}
        <div className="mt-1 flex items-baseline gap-2 text-[14px]">
          {cheapestPrice && <PreviewPrice price={cheapestPrice} />}
          {colours > 1 && <span className="ml-auto text-[11.5px] text-ink-muted">{colours} colours</span>}
        </div>
      </div>
    </LocalizedClientLink>
  )
}
