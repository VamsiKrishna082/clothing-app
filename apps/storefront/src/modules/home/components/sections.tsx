import { CATEGORY_TILES, PROMISES, REVIEWS, SHOW_SAMPLE_REVIEWS, STORY } from "@lib/brand"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { ArrowRightIcon, CashIcon, ReturnIcon, StarIcon, ThreadIcon, TruckIcon } from "@modules/common/icons/line"
import Image from "next/image"

const PROMISE_ICONS = { truck: TruckIcon, cash: CashIcon, return: ReturnIcon, thread: ThreadIcon }

export function PromiseStrip() {
  return (
    <section className="border-b border-sand-dark bg-ivory">
      <div className="content-container grid grid-cols-2 small:grid-cols-4 gap-y-5 py-6">
        {PROMISES.map((p) => {
          const Icon = PROMISE_ICONS[p.icon]
          return (
            <div key={p.title} className="flex items-center gap-3 small:justify-center">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold-light text-gold">
                <Icon size={20} />
              </span>
              <div className="leading-tight">
                <p className="text-[13px] font-semibold">{p.title}</p>
                <p className="text-[12px] text-ink-muted">{p.text}</p>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export function SectionHeader({
  eyebrow,
  title,
  href,
  linkLabel = "View all",
}: {
  eyebrow?: string
  title: string
  href?: string
  linkLabel?: string
}) {
  return (
    <div className="flex items-end justify-between gap-6 mb-8 small:mb-10">
      <div>
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h2 className="section-title">{title}</h2>
      </div>
      {href && (
        <LocalizedClientLink
          href={href}
          className="shrink-0 inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink hover:text-maroon transition-colors border-b border-ink/30 hover:border-maroon pb-0.5"
        >
          {linkLabel} <ArrowRightIcon size={15} />
        </LocalizedClientLink>
      )}
    </div>
  )
}

export function CategoryTiles() {
  return (
    <section className="content-container py-16 small:py-24">
      <SectionHeader eyebrow="Find your fit" title="Shop by category" />
      <ul className="grid grid-cols-2 xsmall:grid-cols-3 small:grid-cols-6 gap-3 small:gap-5">
        {CATEGORY_TILES.map((c) => (
          <li key={c.href}>
            <LocalizedClientLink href={c.href} className="group block">
              <div className="relative aspect-[3/4] overflow-hidden rounded-[999px_999px_16px_16px] bg-sand">
                <Image
                  src={c.image}
                  alt={c.label}
                  fill
                  sizes="(max-width: 512px) 50vw, (max-width: 1024px) 33vw, 16vw"
                  className="object-cover object-top transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <p className="mt-3 text-center text-[14px] font-semibold group-hover:text-maroon transition-colors">{c.label}</p>
            </LocalizedClientLink>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function StorySection() {
  return (
    <section className="bg-sand">
      <div className="content-container grid small:grid-cols-2 gap-10 small:gap-20 items-center py-16 small:py-24">
        <div className="relative aspect-[4/3] small:aspect-[5/4] overflow-hidden rounded-2xl">
          <Image src={STORY.image} alt="Garments hanging in the Tharam studio" fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" />
        </div>
        <div>
          <p className="eyebrow">{STORY.eyebrow}</p>
          <h2 className="section-title mt-3 max-w-lg">{STORY.title}</h2>
          <p className="mt-5 text-[15px] leading-relaxed text-ink-soft max-w-lg">{STORY.text}</p>
          <dl className="mt-8 grid grid-cols-3 gap-4 max-w-md">
            {STORY.stats.map((s) => (
              <div key={s.label} className="border-l-2 border-gold pl-3">
                <dt className="font-display text-3xl font-semibold text-maroon">{s.value}</dt>
                <dd className="text-[12px] text-ink-muted mt-1">{s.label}</dd>
              </div>
            ))}
          </dl>
          <LocalizedClientLink href={STORY.cta.href} className="btn-outline mt-9">
            {STORY.cta.label}
          </LocalizedClientLink>
        </div>
      </div>
    </section>
  )
}

export function Reviews() {
  if (!SHOW_SAMPLE_REVIEWS) return null
  return (
    <section className="content-container py-16 small:py-24">
      <SectionHeader eyebrow="Loved across India" title="What our customers say" />
      <ul className="grid small:grid-cols-3 gap-5">
        {REVIEWS.map((r) => (
          <li key={r.name} className="rounded-2xl bg-white border border-sand-dark p-7 flex flex-col">
            <div className="flex gap-0.5 text-gold" aria-label={`${r.rating} out of 5 stars`}>
              {Array.from({ length: 5 }).map((_, i) => (
                <StarIcon key={i} size={16} filled={i < r.rating} />
              ))}
            </div>
            <p className="mt-4 font-display text-[21px] leading-snug text-ink">“{r.text}”</p>
            <p className="mt-auto pt-6 text-[13px] font-semibold">
              {r.name} <span className="font-normal text-ink-muted">· {r.city}</span>
            </p>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function FestiveBanner() {
  return (
    <section className="content-container py-8">
      <LocalizedClientLink
        href="/collections/festive-edit"
        className="group relative flex flex-col small:flex-row items-start small:items-center justify-between gap-6 overflow-hidden rounded-2xl bg-maroon px-8 py-10 small:px-14 small:py-12 text-ivory"
      >
        <span className="pointer-events-none absolute -right-10 -top-10 h-56 w-56 rounded-full border-[28px] border-gold/20" />
        <span className="pointer-events-none absolute right-40 -bottom-16 h-40 w-40 rounded-full border-[20px] border-gold/10" />
        <div className="relative">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">Festive Sale is live</p>
          <p className="mt-2 font-display text-3xl small:text-[42px] leading-tight font-semibold">Up to 20% off silks, suits & more</p>
        </div>
        <span className="relative btn-light shrink-0">
          Shop the sale <ArrowRightIcon size={18} />
        </span>
      </LocalizedClientLink>
    </section>
  )
}
