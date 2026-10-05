import LocalizedClientLink from "@modules/common/components/localized-client-link"

type Crumb = { label: string; href: string }

/** Header for category / collection / shop pages: breadcrumb, title, blurb, sub-category chips. */
export default function ListingHeader({
  title,
  description,
  crumbs = [],
  chips = [],
  activeChip,
  testId,
}: {
  title: string
  description?: string | null
  crumbs?: Crumb[]
  chips?: Crumb[]
  activeChip?: string
  testId?: string
}) {
  return (
    <header className="bg-sand">
      <div className="content-container py-10 small:py-14">
        <nav className="text-[12px] text-ink-muted" aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li><LocalizedClientLink href="/" className="hover:text-maroon">Home</LocalizedClientLink></li>
            {crumbs.map((c) => (
              <li key={c.href} className="flex items-center gap-1.5">
                <span aria-hidden>›</span>
                <LocalizedClientLink href={c.href} className="hover:text-maroon">{c.label}</LocalizedClientLink>
              </li>
            ))}
          </ol>
        </nav>
        <h1 className="mt-3 font-display text-[40px] small:text-[56px] leading-none font-semibold" data-testid={testId}>
          {title}
        </h1>
        {description && <p className="mt-3 max-w-xl text-[15px] text-ink-soft">{description}</p>}
        {chips.length > 0 && (
          <ul className="mt-6 -mx-6 px-6 flex gap-2 overflow-x-auto no-scrollbar">
            {chips.map((c) => (
              <li key={c.href} className="shrink-0">
                <LocalizedClientLink
                  href={c.href}
                  className={`inline-flex h-10 items-center rounded-full border px-5 text-[13px] font-semibold transition-colors ${
                    activeChip === c.href
                      ? "border-ink bg-ink text-ivory"
                      : "border-sand-dark bg-ivory text-ink hover:border-ink"
                  }`}
                >
                  {c.label}
                </LocalizedClientLink>
              </li>
            ))}
          </ul>
        )}
      </div>
    </header>
  )
}
