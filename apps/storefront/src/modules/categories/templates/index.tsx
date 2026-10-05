import { notFound } from "next/navigation"
import { Suspense } from "react"

import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import ListingHeader from "@modules/store/components/listing-header"
import RefinementList from "@modules/store/components/refinement-list"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import PaginatedProducts from "@modules/store/templates/paginated-products"
import { HttpTypes } from "@medusajs/types"
import { OptionValueIds } from "@lib/util/product-option-filters"

export default function CategoryTemplate({
  category,
  sortBy,
  page,
  countryCode,
  optionValueIds,
}: {
  category: HttpTypes.StoreProductCategory
  sortBy?: SortOptions
  page?: string
  countryCode: string
  optionValueIds?: OptionValueIds
}) {
  const pageNumber = page ? parseInt(page) : 1
  const sort = sortBy || "created_at"

  if (!category || !countryCode) notFound()

  const parents = [] as HttpTypes.StoreProductCategory[]
  const getParents = (c: HttpTypes.StoreProductCategory) => {
    if (c.parent_category) {
      parents.unshift(c.parent_category)
      getParents(c.parent_category)
    }
  }
  getParents(category)

  // Chips: a parent shows its children; a child shows its siblings (with "All <parent>").
  const parent = parents[parents.length - 1]
  const chipSource = category.category_children?.length ? category : parent
  const chips = chipSource
    ? [
        { label: `All ${chipSource.name}`, href: `/categories/${chipSource.handle}` },
        ...(chipSource.category_children ?? []).map((c) => ({ label: c.name, href: `/categories/${c.handle}` })),
      ]
    : []

  return (
    <div data-testid="category-container">
      <ListingHeader
        title={category.name}
        description={category.description}
        crumbs={parents.map((p) => ({ label: p.name, href: `/categories/${p.handle}` }))}
        chips={chips}
        activeChip={`/categories/${category.handle}`}
        testId="category-page-title"
      />
      <div className="content-container flex flex-col small:flex-row small:items-start py-8">
        <RefinementList sortBy={sort} data-testid="sort-by-container" hideOptionsPicker />
        <div className="w-full">
          <Suspense fallback={<SkeletonProductGrid numberOfProducts={category.products?.length ?? 8} />}>
            <PaginatedProducts
              sortBy={sort}
              page={pageNumber}
              categoryId={category.id}
              countryCode={countryCode}
              optionValueIds={optionValueIds}
            />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
