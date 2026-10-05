"use client"

import { BRAND } from "@lib/brand"
import { CashIcon, ShieldIcon } from "@modules/common/icons/line"

import CartTotals from "@modules/common/components/cart-totals"
import Divider from "@modules/common/components/divider"
import DiscountCode from "@modules/checkout/components/discount-code"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"

type SummaryProps = {
  cart: HttpTypes.StoreCart
}

function getCheckoutStep(cart: HttpTypes.StoreCart) {
  if (!cart?.shipping_address?.address_1 || !cart.email) {
    return "address"
  } else if (cart?.shipping_methods?.length === 0) {
    return "delivery"
  } else {
    return "payment"
  }
}

const Summary = ({ cart }: SummaryProps) => {
  const step = getCheckoutStep(cart)

  return (
    <div className="flex flex-col gap-y-4">
      <h2 className="font-display text-3xl font-semibold">Order summary</h2>
      <DiscountCode cart={cart} />
      <Divider />
      <CartTotals totals={cart} />
      <LocalizedClientLink
        href={"/checkout?step=" + step}
        data-testid="checkout-button"
        className="btn-primary w-full h-14 text-[15px]"
      >
        Proceed to checkout
      </LocalizedClientLink>
      <ul className="flex flex-col gap-2 text-[12.5px] text-ink-soft">
        <li className="flex items-center gap-2"><CashIcon size={16} className="text-gold" /> Cash on Delivery available</li>
        <li className="flex items-center gap-2"><ShieldIcon size={16} className="text-gold" /> Secure checkout · {BRAND.returnDays}-day easy returns</li>
      </ul>
    </div>
  )
}

export default Summary
