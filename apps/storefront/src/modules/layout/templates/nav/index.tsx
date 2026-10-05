import { Suspense } from "react"
import Image from "next/image"

import { BRAND, NAV } from "@lib/brand"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { BagIcon, ChevronDownIcon, UserIcon } from "@modules/common/icons/line"
import AnnouncementBar from "@modules/layout/components/announcement-bar"
import CartButton from "@modules/layout/components/cart-button"
import Search from "@modules/layout/components/search"
import SideMenu from "@modules/layout/components/side-menu"

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`flex flex-col items-center leading-none ${className}`}>
      <span className="font-display text-[28px] small:text-[32px] font-semibold tracking-[0.18em] text-ink">
        THARAM
      </span>
      <span className="text-[11px] text-gold mt-1 font-medium">{BRAND.tamil}</span>
    </span>
  )
}

export default async function Nav() {
  return (
    <div className="sticky top-0 inset-x-0 z-50">
      <AnnouncementBar />
      <header className="relative bg-ivory/95 backdrop-blur-md border-b border-sand-dark">
        <nav className="content-container flex items-center justify-between h-[68px] small:h-[76px] text-ink">
          {/* Left: menu (mobile) / categories (desktop) */}
          <div className="flex-1 basis-0 flex items-center h-full">
            <div className="small:hidden h-full">
              <SideMenu />
            </div>
            <ul className="hidden small:flex items-center gap-x-7 h-full text-[13px] font-semibold tracking-wide">
              {NAV.map((group) => (
                <li key={group.label} className="group/nav h-full flex items-center">
                  <LocalizedClientLink
                    href={group.href}
                    className="relative flex items-center gap-1 py-2 hover:text-maroon transition-colors after:absolute after:left-0 after:-bottom-0.5 after:h-[1.5px] after:w-0 after:bg-maroon after:transition-all group-hover/nav:after:w-full"
                  >
                    {group.label}
                    {group.links.length > 0 && <ChevronDownIcon size={14} className="transition-transform group-hover/nav:rotate-180" />}
                  </LocalizedClientLink>

                  {group.links.length > 0 && (
                    <div className="invisible opacity-0 translate-y-1 group-hover/nav:visible group-hover/nav:opacity-100 group-hover/nav:translate-y-0 group-focus-within/nav:visible group-focus-within/nav:opacity-100 transition-all duration-200 absolute left-0 right-0 top-full bg-ivory border-b border-sand-dark shadow-[0_24px_40px_-24px_rgba(30,26,23,0.25)]">
                      <div className="content-container grid grid-cols-[1fr_1fr_320px] gap-10 py-10">
                        <div>
                          <p className="eyebrow mb-4">Shop {group.label}</p>
                          <ul className="flex flex-col gap-3 font-normal text-[15px]">
                            {group.links.map((l) => (
                              <li key={l.href}>
                                <LocalizedClientLink href={l.href} className="hover:text-maroon transition-colors">
                                  {l.label}
                                </LocalizedClientLink>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="eyebrow mb-4">Highlights</p>
                          <ul className="flex flex-col gap-3 font-normal text-[15px]">
                            <li><LocalizedClientLink href="/collections/new-arrivals" className="hover:text-maroon">New arrivals</LocalizedClientLink></li>
                            <li><LocalizedClientLink href="/collections/bestsellers" className="hover:text-maroon">Bestsellers</LocalizedClientLink></li>
                            <li><LocalizedClientLink href="/collections/festive-edit" className="hover:text-maroon">Festive Edit</LocalizedClientLink></li>
                            <li><LocalizedClientLink href="/pages/size-guide" className="hover:text-maroon">Size guide</LocalizedClientLink></li>
                          </ul>
                        </div>
                        {group.feature && (
                          <LocalizedClientLink href={group.feature.href} className="group/feat relative block aspect-[4/3] overflow-hidden rounded-xl bg-sand">
                            <Image
                              src={group.feature.image}
                              alt={group.feature.title}
                              fill
                              sizes="320px"
                              className="object-cover object-top transition-transform duration-500 group-hover/feat:scale-105"
                            />
                            <span className="absolute inset-0 bg-gradient-to-t from-ink/60 to-transparent" />
                            <span className="absolute bottom-4 left-4 font-display text-2xl text-ivory">{group.feature.title} →</span>
                          </LocalizedClientLink>
                        )}
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Centre: wordmark */}
          <LocalizedClientLink href="/" aria-label="Tharam home" data-testid="nav-store-link">
            <Wordmark />
          </LocalizedClientLink>

          {/* Right: search, account, bag */}
          <div className="flex-1 basis-0 flex items-center justify-end gap-x-5 small:gap-x-6 h-full">
            <Search />
            <LocalizedClientLink
              href="/account"
              aria-label="Account"
              className="hidden small:flex p-2 -m-2 hover:text-maroon transition-colors"
              data-testid="nav-account-link"
            >
              <UserIcon size={21} />
            </LocalizedClientLink>
            <Suspense
              fallback={
                <LocalizedClientLink href="/cart" aria-label="Bag" className="p-2 -m-2" data-testid="nav-cart-link">
                  <BagIcon size={22} />
                </LocalizedClientLink>
              }
            >
              <CartButton />
            </Suspense>
          </div>
        </nav>
      </header>
    </div>
  )
}
