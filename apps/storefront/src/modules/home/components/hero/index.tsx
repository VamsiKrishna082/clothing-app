import { HERO } from "@lib/brand"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { ArrowRightIcon } from "@modules/common/icons/line"
import Image from "next/image"

/** Split hero: editorial copy on ivory + full-height photograph. LCP image is `priority`. */
const Hero = () => {
  return (
    <section className="relative bg-sand overflow-hidden">
      <div className="grid small:grid-cols-[1fr_1.05fr] min-h-[78vh] small:min-h-[640px]">
        <div className="relative order-2 small:order-1 flex flex-col justify-center px-6 py-14 small:px-16 xlarge:px-28">
          <p className="eyebrow">{HERO.eyebrow}</p>
          <h1 className="mt-5 font-display text-[44px] leading-[1.02] small:text-[68px] font-semibold text-ink max-w-xl">
            {HERO.title.split(" ").slice(0, -2).join(" ")}{" "}
            <em className="text-maroon">{HERO.title.split(" ").slice(-2).join(" ")}</em>
          </h1>
          <p className="mt-6 text-[15px] small:text-base leading-relaxed text-ink-soft max-w-md">{HERO.text}</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <LocalizedClientLink href={HERO.primary.href} className="btn-primary">
              {HERO.primary.label} <ArrowRightIcon size={18} />
            </LocalizedClientLink>
            <LocalizedClientLink href={HERO.secondary.href} className="btn-outline">
              {HERO.secondary.label}
            </LocalizedClientLink>
          </div>
          <div className="mt-12 flex items-center gap-6 text-[12px] text-ink-muted">
            <span>✦ Handwoven silks</span>
            <span>✦ Tiruppur cotton</span>
            <span className="hidden xsmall:inline">✦ COD across India</span>
          </div>
        </div>
        <div className="relative order-1 small:order-2 min-h-[56vh] small:min-h-full">
          <Image
            src={HERO.image}
            alt={HERO.imageAlt}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 52vw"
            className="object-cover object-[50%_20%]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/30 via-transparent to-transparent small:hidden" />
          <LocalizedClientLink
            href={HERO.featured.href}
            className="absolute bottom-6 right-6 hidden small:block rounded-2xl bg-ivory/90 backdrop-blur px-5 py-4 shadow-lg hover:bg-ivory transition-colors"
          >
            <p className="text-[11px] uppercase tracking-[0.2em] text-ink-muted">Featured</p>
            <p className="font-display text-xl font-semibold">{HERO.featured.title}</p>
            <p className="text-sm text-maroon font-semibold">Shop the look →</p>
          </LocalizedClientLink>
        </div>
      </div>
    </section>
  )
}

export default Hero
