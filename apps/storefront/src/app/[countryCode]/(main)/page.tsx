import { Metadata } from "next"

import { listCollections } from "@lib/data/collections"
import { getRegion } from "@lib/data/regions"
import ProductRail from "@modules/home/components/featured-products/product-rail"
import Hero from "@modules/home/components/hero"
import {
  CategoryTiles,
  FestiveBanner,
  PromiseStrip,
  Reviews,
  StorySection,
} from "@modules/home/components/sections"

export const metadata: Metadata = {
  title: { absolute: "Tharam — Sarees, kurtas & quality clothing, woven in India" },
  description:
    "Shop Kanjivaram silk sarees, anarkalis, dresses, formal shirts and Tiruppur cotton tees. Free shipping above ₹999, Cash on Delivery and 7-day returns.",
}

/** Order and eyebrow text of the collection rails on the home page. */
const RAILS: { handle: string; eyebrow: string }[] = [
  { handle: "festive-edit", eyebrow: "Celebrate in style" },
  { handle: "bestsellers", eyebrow: "Most loved" },
  { handle: "new-arrivals", eyebrow: "Just landed" },
  { handle: "everyday-cotton", eyebrow: "Breathable basics" },
]

export default async function Home(props: { params: Promise<{ countryCode: string }> }) {
  const { countryCode } = await props.params

  const [region, { collections }] = await Promise.all([
    getRegion(countryCode),
    listCollections({ fields: "id, handle, title" }),
  ])

  if (!region) {
    return null
  }

  const byHandle = new Map((collections ?? []).map((c) => [c.handle, c]))
  const rail = (i: number) => {
    const c = byHandle.get(RAILS[i].handle)
    return c ? <ProductRail collection={c} region={region} eyebrow={RAILS[i].eyebrow} /> : null
  }

  return (
    <>
      <Hero />
      <PromiseStrip />
      <CategoryTiles />
      {rail(0)}
      <FestiveBanner />
      {rail(1)}
      <StorySection />
      {rail(2)}
      <Reviews />
      {rail(3)}
    </>
  )
}
