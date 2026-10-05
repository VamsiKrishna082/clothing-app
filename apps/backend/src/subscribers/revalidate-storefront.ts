import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/** Which storefront cache tags each event invalidates. */
const TAGS_BY_EVENT: Record<string, string[]> = {
  "product.created": ["products"],
  "product.updated": ["products"],
  "product.deleted": ["products"],
  "product-variant.created": ["products", "variants"],
  "product-variant.updated": ["products", "variants"],
  "product-variant.deleted": ["products", "variants"],
  "inventory-level.created": ["products", "variants"],
  "inventory-level.updated": ["products", "variants"],
  "price-list.created": ["products"],
  "price-list.updated": ["products"],
  "price-list.deleted": ["products"],
  "product-category.created": ["categories"],
  "product-category.updated": ["categories"],
  "product-category.deleted": ["categories"],
  "product-collection.created": ["collections"],
  "product-collection.updated": ["collections"],
  "product-collection.deleted": ["collections"],
  "region.updated": ["regions"],
}

/**
 * Admin edits → storefront cache bust (architecture §3). Fire-and-forget: a
 * failure is logged, never blocks the admin action. Cloudflare purge is added
 * alongside this once the edge is live.
 */
export default async function revalidateStorefront({ event, container }: SubscriberArgs<unknown>) {
  const url = process.env.STOREFRONT_URL
  const secret = process.env.REVALIDATE_SECRET
  if (!url || !secret) return

  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const tags = TAGS_BY_EVENT[event.name] ?? ["products"]
  try {
    const res = await fetch(`${url.replace(/\/$/, "")}/api/revalidate`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-revalidate-secret": secret },
      body: JSON.stringify({ tags }),
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) logger.warn(`[revalidate] storefront answered ${res.status} for ${event.name}`)
  } catch (e) {
    logger.warn(`[revalidate] could not reach storefront for ${event.name}: ${(e as Error).message}`)
  }
}

export const config: SubscriberConfig = {
  event: Object.keys(TAGS_BY_EVENT),
}
