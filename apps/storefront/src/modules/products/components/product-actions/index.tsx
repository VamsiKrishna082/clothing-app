"use client"

import { addToCart } from "@lib/data/cart"
import { useIntersection } from "@lib/hooks/use-in-view"
import { HttpTypes } from "@medusajs/types"
import { BRAND } from "@lib/brand"
import { CashIcon, ReturnIcon, TruckIcon } from "@modules/common/icons/line"
import OptionSelect from "@modules/products/components/product-actions/option-select"
import { isEqual } from "lodash"
import { useParams, usePathname, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import ProductPrice from "../product-price"
import MobileActions from "./mobile-actions"
import { useRouter } from "next/navigation"

type ProductActionsProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  disabled?: boolean
}

const optionsAsKeymap = (
  variantOptions: HttpTypes.StoreProductVariant["options"]
) => {
  return variantOptions?.reduce((acc: Record<string, string>, varopt) => {
    if (varopt.option_id) acc[varopt.option_id] = varopt.value
    return acc
  }, {})
}

export default function ProductActions({
  product,
  disabled,
}: ProductActionsProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [options, setOptions] = useState<Record<string, string | undefined>>({})
  const [isAdding, setIsAdding] = useState(false)
  const countryCode = useParams().countryCode as string

  // Preselect: everything when there's one variant, otherwise any option with a single value
  // (e.g. a one-colour product only asks for the size).
  useEffect(() => {
    if (product.variants?.length === 1) {
      const variantOptions = optionsAsKeymap(product.variants[0].options)
      setOptions(variantOptions ?? {})
      return
    }
    const single = Object.fromEntries(
      (product.options ?? [])
        .filter((o) => o.values?.length === 1)
        .map((o) => [o.id, o.values![0].value])
    )
    if (Object.keys(single).length) setOptions((prev) => ({ ...single, ...prev }))
  }, [product.variants, product.options])

  const selectedVariant = useMemo(() => {
    if (!product.variants || product.variants.length === 0) {
      return
    }

    return product.variants.find((v) => {
      const variantOptions = optionsAsKeymap(v.options)
      return isEqual(variantOptions, options)
    })
  }, [product.variants, options])

  // update the options when a variant is selected
  const setOptionValue = (optionId: string, value: string) => {
    setOptions((prev) => ({
      ...prev,
      [optionId]: value,
    }))
  }

  //check if the selected options produce a valid variant
  const isValidVariant = useMemo(() => {
    return product.variants?.some((v) => {
      const variantOptions = optionsAsKeymap(v.options)
      return isEqual(variantOptions, options)
    })
  }, [product.variants, options])

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    const value = isValidVariant ? selectedVariant?.id : null

    if (params.get("v_id") === value) {
      return
    }

    if (value) {
      params.set("v_id", value)
    } else {
      params.delete("v_id")
    }

    router.replace(pathname + "?" + params.toString())
  }, [selectedVariant, isValidVariant])

  // check if the selected variant is in stock
  const inStock = useMemo(() => {
    // If we don't manage inventory, we can always add to cart
    if (selectedVariant && !selectedVariant.manage_inventory) {
      return true
    }

    // If we allow back orders on the variant, we can add to cart
    if (selectedVariant?.allow_backorder) {
      return true
    }

    // If there is inventory available, we can add to cart
    if (
      selectedVariant?.manage_inventory &&
      (selectedVariant?.inventory_quantity || 0) > 0
    ) {
      return true
    }

    // Otherwise, we can't add to cart
    return false
  }, [selectedVariant])

  const actionsRef = useRef<HTMLDivElement>(null)

  const inView = useIntersection(actionsRef, "0px")

  // add the selected variant to the cart
  const handleAddToCart = async () => {
    if (!selectedVariant?.id) return null

    setIsAdding(true)

    await addToCart({
      variantId: selectedVariant.id,
      quantity: 1,
      countryCode,
    })

    setIsAdding(false)
  }

  const lowStock =
    selectedVariant?.manage_inventory && !selectedVariant.allow_backorder
      ? selectedVariant.inventory_quantity ?? 0
      : null

  return (
    <>
      <div className="flex flex-col gap-y-6" ref={actionsRef}>
        <ProductPrice product={product} variant={selectedVariant} />

        {(product.variants?.length ?? 0) > 1 && (
          <div className="flex flex-col gap-y-5">
            {(product.options || []).map((option) => (
              <OptionSelect
                key={option.id}
                option={option}
                current={options[option.id]}
                updateOption={setOptionValue}
                title={option.title ?? ""}
                data-testid="product-options"
                disabled={!!disabled || isAdding}
              />
            ))}
          </div>
        )}

        <div className="flex flex-col gap-y-3">
          {inStock && lowStock !== null && lowStock > 0 && lowStock <= 3 && (
            <p className="text-[13px] font-semibold text-maroon">Hurry — only {lowStock} left in this size</p>
          )}
          <button
            onClick={handleAddToCart}
            disabled={!inStock || !selectedVariant || !!disabled || isAdding || !isValidVariant}
            className="btn-primary w-full h-14 text-[15px]"
            data-testid="add-product-button"
          >
            {isAdding
              ? "Adding…"
              : !selectedVariant
              ? `Select ${(product.options ?? []).filter((o) => !options[o.id]).map((o) => o.title?.toLowerCase()).join(" & ") || "options"}`
              : !inStock || !isValidVariant
              ? "Out of stock"
              : "Add to bag"}
          </button>
        </div>

        <ul className="grid grid-cols-3 gap-2 rounded-2xl bg-sand p-4 text-center text-[11.5px] leading-tight text-ink-soft">
          <li className="flex flex-col items-center gap-1.5"><TruckIcon size={20} className="text-gold" />Free shipping<br />above ₹{BRAND.freeShippingAbove}</li>
          <li className="flex flex-col items-center gap-1.5"><CashIcon size={20} className="text-gold" />Cash on<br />Delivery</li>
          <li className="flex flex-col items-center gap-1.5"><ReturnIcon size={20} className="text-gold" />{BRAND.returnDays}-day easy<br />returns</li>
        </ul>
        <MobileActions
          product={product}
          variant={selectedVariant}
          options={options}
          updateOptions={setOptionValue}
          inStock={inStock}
          handleAddToCart={handleAddToCart}
          isAdding={isAdding}
          show={!inView}
          optionsDisabled={!!disabled || isAdding}
        />
      </div>
    </>
  )
}
