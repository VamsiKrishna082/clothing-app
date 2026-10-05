import { HttpTypes } from "@medusajs/types"
import { clx } from "@modules/common/components/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { RulerIcon } from "@modules/common/icons/line"
import React from "react"

type OptionSelectProps = {
  option: HttpTypes.StoreProductOption
  current: string | undefined
  updateOption: (title: string, value: string) => void
  title: string
  disabled: boolean
  /** Option values with no stock in any variant — shown struck through. */
  unavailable?: Set<string>
  "data-testid"?: string
}

const OptionSelect: React.FC<OptionSelectProps> = ({
  option,
  current,
  updateOption,
  title,
  unavailable,
  "data-testid": dataTestId,
  disabled,
}) => {
  const values = (option.values ?? []).map((v) => v.value)
  const isSize = /size/i.test(title)

  return (
    <div className="flex flex-col gap-y-3">
      <div className="flex items-center justify-between text-[13px]">
        <span>
          <span className="font-semibold">{title}</span>
          {current && <span className="text-ink-muted">: {current}</span>}
        </span>
        {isSize && values.length > 1 && (
          <LocalizedClientLink href="/pages/size-guide" className="inline-flex items-center gap-1 text-maroon font-semibold underline-offset-4 hover:underline">
            <RulerIcon size={15} /> Size guide
          </LocalizedClientLink>
        )}
      </div>
      <div className="flex flex-wrap gap-2" data-testid={dataTestId}>
        {values.map((v) => {
          const selected = v === current
          const soldOut = unavailable?.has(v)
          return (
            <button
              onClick={() => updateOption(option.id, v)}
              key={v}
              aria-pressed={selected}
              className={clx(
                "relative h-11 rounded-full border px-4 text-[13px] font-semibold transition-all duration-150",
                isSize ? "min-w-[52px]" : "min-w-[72px]",
                selected
                  ? "border-ink bg-ink text-ivory"
                  : "border-sand-dark bg-white text-ink hover:border-ink",
                soldOut && !selected && "text-ink-muted line-through decoration-ink-muted/60"
              )}
              disabled={disabled}
              data-testid="option-button"
            >
              {v}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default OptionSelect
