import { Suspense } from "react"

import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import ListingHeader from "@modules/store/components/listing-header"
import RefinementList from "@modules/store/components/refinement-list"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import PaginatedProducts from "@modules/store/templates/paginated-products"
import { HttpTypes } from "@medusajs/types"
import { OptionValueIds } from "@lib/util/product-option-filters"

const BLURBS: Record<string, string> = {
  "festive-edit": "Silks, anarkalis and sharp suits for weddings, pujas and every celebration in between.",
  "new-arrivals": "Fresh off the loom and the sewing table — the latest Tharam styles.",
  "everyday-cotton": "Breathable Tiruppur cotton made for Indian summers and everyday comfort.",
  bestsellers: "The pieces our customers come back for, again and again.",
}

const SIBLINGS = [
  { label: "Festive Edit", href: "/collections/festive-edit" },
  { label: "New Arrivals", href: "/collections/new-arrivals" },
  { label: "Bestsellers", href: "/collections/bestsellers" },
  { label: "Everyday Cotton", href: "/collections/everyday-cotton" },
]

export default function CollectionTemplate({
  sortBy,
  collection,
  page,
  countryCode,
  optionValueIds,
}: {
  sortBy?: SortOptions
  collection: HttpTypes.StoreCollection
  page?: string
  countryCode: string
  optionValueIds?: OptionValueIds
}) {
  const pageNumber = page ? parseInt(page) : 1
  const sort = sortBy || "created_at"

  return (
    <div>
      <ListingHeader
        title={collection.title}
        description={BLURBS[collection.handle] ?? (collection.metadata?.description as string | undefined)}
        crumbs={[{ label: "Collections", href: "/store" }]}
        chips={SIBLINGS}
        activeChip={`/collections/${collection.handle}`}
      />
      <div className="content-container flex flex-col small:flex-row small:items-start py-8">
        <RefinementList sortBy={sort} hideOptionsPicker />
        <div className="w-full">
          <Suspense fallback={<SkeletonProductGrid numberOfProducts={collection.products?.length} />}>
            <PaginatedProducts
              sortBy={sort}
              page={pageNumber}
              collectionId={collection.id}
              countryCode={countryCode}
              optionValueIds={optionValueIds}
            />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
