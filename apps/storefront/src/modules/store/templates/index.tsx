"use client"

import type { SearchClient } from "instantsearch.js"
import { Configure, InstantSearch } from "react-instantsearch"

import { PRODUCT_INDEX_NAME, searchClient } from "@lib/search-client"
import StoreHits from "@modules/store/components/store-hits"
import StoreRefinements from "@modules/store/components/store-refinements"
import StoreSearchBox from "@modules/store/components/store-search-box"
import ListingHeader from "@modules/store/components/listing-header"

const PRODUCT_LIMIT = 12

const StoreTemplate = ({ currencyCode }: { currencyCode: string }) => {
  return (
    <div data-testid="category-container">
      <ListingHeader
        title="Shop all"
        description="Sarees, kurtas, dresses, shirts and everyday cotton — search and filter the whole Tharam collection."
        testId="store-page-title"
      />
      <div className="content-container py-8 flex flex-col small:flex-row small:items-start">
        <InstantSearch
          indexName={PRODUCT_INDEX_NAME}
          searchClient={searchClient as unknown as SearchClient}
          routing
          future={{ preserveSharedStateOnUnmount: true }}
        >
          <Configure hitsPerPage={PRODUCT_LIMIT} />
          <StoreRefinements currencyCode={currencyCode} />
          <div className="w-full min-w-0">
            <StoreSearchBox />
            <StoreHits
              hitsPerPage={PRODUCT_LIMIT}
              currencyCode={currencyCode}
            />
          </div>
        </InstantSearch>
      </div>
    </div>
  )
}

export default StoreTemplate
