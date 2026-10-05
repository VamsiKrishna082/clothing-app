"use client"

import { convertToLocale } from "@lib/util/money"
import React from "react"

type CartTotalsProps = {
  totals: {
    total?: number | null
    subtotal?: number | null
    tax_total?: number | null
    currency_code: string
    item_total?: number | null
    item_subtotal?: number | null
    shipping_total?: number | null
    shipping_subtotal?: number | null
    discount_total?: number | null
    discount_subtotal?: number | null
    shipping_methods?: unknown[] | null
  }
}

/**
 * Indian-style bill: prices already include GST, so items are shown GST-inclusive
 * and the GST share is stated underneath rather than added on top.
 */
const CartTotals: React.FC<CartTotalsProps> = ({ totals }) => {
  const { currency_code, total, tax_total } = totals
  const items = totals.item_total ?? totals.item_subtotal ?? 0
  const shipping = totals.shipping_total ?? totals.shipping_subtotal ?? 0
  const discount = totals.discount_total ?? totals.discount_subtotal ?? 0
  const shippingChosen = (totals.shipping_methods?.length ?? 0) > 0
  const fmt = (amount: number) => convertToLocale({ amount, currency_code })

  return (
    <div>
      <div className="flex flex-col gap-y-2.5 text-[14px] text-ink-soft">
        <div className="flex items-center justify-between">
          <span>Items (incl. GST)</span>
          <span data-testid="cart-subtotal" data-value={items}>{fmt(items)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Delivery</span>
          <span data-testid="cart-shipping" data-value={shipping}>
            {!shippingChosen ? (
              <span className="text-ink-muted">Calculated at checkout</span>
            ) : shipping === 0 ? (
              <span className="font-semibold text-maroon">FREE</span>
            ) : (
              fmt(shipping)
            )}
          </span>
        </div>
        {!!discount && (
          <div className="flex items-center justify-between">
            <span>Discount</span>
            <span className="font-semibold text-maroon" data-testid="cart-discount" data-value={discount}>
              − {fmt(discount)}
            </span>
          </div>
        )}
      </div>
      <div className="h-px w-full bg-sand-dark my-4" />
      <div className="flex items-center justify-between text-ink">
        <span className="font-semibold">Total</span>
        <span className="text-[22px] font-bold" data-testid="cart-total" data-value={total || 0}>
          {fmt(total ?? 0)}
        </span>
      </div>
      <p className="mt-1 text-right text-[12px] text-ink-muted" data-testid="cart-taxes" data-value={tax_total || 0}>
        Includes {fmt(tax_total ?? 0)} GST
      </p>
      <div className="h-px w-full bg-sand-dark mt-4" />
    </div>
  )
}

export default CartTotals
