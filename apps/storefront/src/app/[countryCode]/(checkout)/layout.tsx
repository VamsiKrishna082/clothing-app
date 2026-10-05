import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ChevronDown from "@modules/common/icons/chevron-down"
import { ShieldIcon } from "@modules/common/icons/line"
import { Wordmark } from "@modules/layout/templates/nav"

/** Distraction-free checkout: no menu, no footer — just the way back and reassurance. */
export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="w-full bg-ivory relative small:min-h-screen">
      <div className="h-[72px] bg-ivory border-b border-sand-dark">
        <nav className="flex h-full items-center content-container justify-between">
          <LocalizedClientLink
            href="/cart"
            className="text-sm text-ink-soft hover:text-maroon flex items-center gap-x-2 flex-1 basis-0"
            data-testid="back-to-cart-link"
          >
            <ChevronDown className="rotate-90" size={16} />
            <span className="hidden small:block">Back to bag</span>
            <span className="block small:hidden">Back</span>
          </LocalizedClientLink>
          <LocalizedClientLink href="/" data-testid="store-link" aria-label="Tharam home">
            <Wordmark />
          </LocalizedClientLink>
          <div className="flex-1 basis-0 flex justify-end items-center gap-2 text-[12px] text-ink-soft">
            <ShieldIcon size={18} className="text-gold" />
            <span className="hidden small:inline">Secure checkout</span>
          </div>
        </nav>
      </div>
      <div className="relative" data-testid="checkout-container">{children}</div>
    </div>
  )
}
