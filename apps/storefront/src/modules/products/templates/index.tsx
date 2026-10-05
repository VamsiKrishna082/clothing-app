import React, { Suspense } from "react"

import ImageGallery from "@modules/products/components/image-gallery"
import ProductActions from "@modules/products/components/product-actions"
import ProductTabs from "@modules/products/components/product-tabs"
import RelatedProducts from "@modules/products/components/related-products"
import ProductInfo from "@modules/products/templates/product-info"
import SkeletonRelatedProducts from "@modules/skeletons/templates/skeleton-related-products"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { notFound } from "next/navigation"
import { HttpTypes } from "@medusajs/types"

import ProductActionsWrapper from "./product-actions-wrapper"

type ProductTemplateProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  countryCode: string
  images: HttpTypes.StoreProductImage[]
}

const ProductTemplate: React.FC<ProductTemplateProps> = ({
  product,
  region,
  countryCode,
  images,
}) => {
  if (!product || !product.id) {
    return notFound()
  }

  // Deepest category for the breadcrumb (e.g. Women › Sarees).
  const category =
    product.categories?.find((c) => c.parent_category_id) ?? product.categories?.[0]

  return (
    <>
      <nav className="content-container pt-5 pb-2 text-[12px] text-ink-muted" aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li><LocalizedClientLink href="/" className="hover:text-maroon">Home</LocalizedClientLink></li>
          {category && (
            <>
              <li aria-hidden>›</li>
              <li><LocalizedClientLink href={`/categories/${category.handle}`} className="hover:text-maroon">{category.name}</LocalizedClientLink></li>
            </>
          )}
          <li aria-hidden>›</li>
          <li className="text-ink line-clamp-1">{product.title}</li>
        </ol>
      </nav>

      <div
        className="content-container grid small:grid-cols-[1.2fr_1fr] gap-8 small:gap-14 pb-10"
        data-testid="product-container"
      >
        <div className="-mx-6 small:mx-0">
          <ImageGallery images={images} title={product.title ?? ""} />
        </div>
        <div className="small:sticky small:top-[140px] self-start flex flex-col gap-y-7">
          <ProductInfo product={product} />
          <Suspense fallback={<ProductActions disabled={true} product={product} region={region} />}>
            <ProductActionsWrapper id={product.id} region={region} />
          </Suspense>
          <ProductTabs product={product} />
        </div>
      </div>

      <div className="content-container my-12 small:my-20" data-testid="related-products-container">
        <Suspense fallback={<SkeletonRelatedProducts />}>
          <RelatedProducts product={product} countryCode={countryCode} />
        </Suspense>
      </div>
    </>
  )
}

export default ProductTemplate
