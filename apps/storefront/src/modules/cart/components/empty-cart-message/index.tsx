import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { BagIcon } from "@modules/common/icons/line"

const EmptyCartMessage = () => {
  return (
    <div className="py-28 px-2 flex flex-col items-center text-center" data-testid="empty-cart-message">
      <span className="flex h-20 w-20 items-center justify-center rounded-full bg-gold-light text-gold">
        <BagIcon size={36} />
      </span>
      <h1 className="mt-6 font-display text-4xl font-semibold">Your bag is empty</h1>
      <p className="mt-3 mb-8 max-w-md text-ink-soft">
        Silk sarees, everyday cottons, sharp shirts — find something you&apos;ll love.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <LocalizedClientLink href="/collections/bestsellers" className="btn-primary">Shop bestsellers</LocalizedClientLink>
        <LocalizedClientLink href="/collections/new-arrivals" className="btn-outline">New arrivals</LocalizedClientLink>
      </div>
    </div>
  )
}

export default EmptyCartMessage
