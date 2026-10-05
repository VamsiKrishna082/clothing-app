import { clx } from "@modules/common/components/ui"

type FilterRadioGroupProps = {
  title: string
  items: {
    value: string
    label: string
  }[]
  value: string
  handleChange: (value: string) => void
  "data-testid"?: string
}

/** Single-choice pills (sort order etc.). Wraps on phones, stacks in the desktop sidebar. */
const FilterRadioGroup = ({
  title,
  items,
  value,
  handleChange,
  "data-testid": dataTestId,
}: FilterRadioGroupProps) => {
  return (
    <div className="flex flex-col gap-y-3">
      <p className="eyebrow">{title}</p>
      <div role="radiogroup" aria-label={title} className="flex flex-wrap small:flex-col gap-2" data-testid={dataTestId}>
        {items?.map((i) => {
          const active = i.value === value
          return (
            <button
              key={i.value}
              role="radio"
              aria-checked={active}
              onClick={() => handleChange(i.value)}
              className={clx(
                "h-9 rounded-full border px-4 text-left text-[13px] font-semibold transition-colors small:w-full",
                active ? "border-ink bg-ink text-ivory" : "border-sand-dark bg-white text-ink-soft hover:border-ink"
              )}
              data-testid="radio-label"
              data-active={active}
            >
              {i.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default FilterRadioGroup
