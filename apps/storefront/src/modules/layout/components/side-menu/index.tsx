"use client"

import { Dialog, DialogPanel, Transition, TransitionChild } from "@headlessui/react"
import { BRAND, NAV, PROMISES } from "@lib/brand"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { ChevronDownIcon, CloseIcon, MenuIcon, UserIcon, WhatsAppIcon } from "@modules/common/icons/line"
import { Fragment, useState } from "react"

/** Mobile navigation drawer. */
const SideMenu = () => {
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState<string | null>("Women")
  const close = () => setOpen(false)

  return (
    <div className="h-full flex items-center">
      <button
        onClick={() => setOpen(true)}
        className="p-2 -m-2 hover:text-maroon"
        aria-label="Open menu"
        data-testid="nav-menu-button"
      >
        <MenuIcon size={24} />
      </button>

      <Transition show={open} as={Fragment}>
        <Dialog onClose={close} className="relative z-[60]">
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-ink/40" />
          </TransitionChild>
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="-translate-x-full"
            enterTo="translate-x-0"
            leave="ease-in duration-200"
            leaveFrom="translate-x-0"
            leaveTo="-translate-x-full"
          >
            <DialogPanel
              className="fixed inset-y-0 left-0 w-[86%] max-w-sm bg-ivory flex flex-col overflow-y-auto"
              data-testid="nav-menu-popup"
            >
              <div className="flex items-center justify-between px-5 h-16 border-b border-sand-dark">
                <span className="font-display text-2xl font-semibold tracking-[0.18em]">THARAM</span>
                <button onClick={close} aria-label="Close menu" className="p-2 -m-2" data-testid="close-menu-button">
                  <CloseIcon size={22} />
                </button>
              </div>

              <ul className="px-5 py-2">
                {NAV.map((group) => (
                  <li key={group.label} className="border-b border-sand-dark">
                    {group.links.length ? (
                      <>
                        <button
                          className="w-full flex items-center justify-between py-4 font-display text-2xl font-semibold"
                          onClick={() => setExpanded(expanded === group.label ? null : group.label)}
                          aria-expanded={expanded === group.label}
                        >
                          {group.label}
                          <ChevronDownIcon className={`transition-transform ${expanded === group.label ? "rotate-180" : ""}`} />
                        </button>
                        {expanded === group.label && (
                          <ul className="pb-4 pl-1 flex flex-col gap-3 text-[15px] text-ink-soft">
                            {group.links.map((l) => (
                              <li key={l.href}>
                                <LocalizedClientLink href={l.href} onClick={close} className="block hover:text-maroon">
                                  {l.label}
                                </LocalizedClientLink>
                              </li>
                            ))}
                          </ul>
                        )}
                      </>
                    ) : (
                      <LocalizedClientLink href={group.href} onClick={close} className="block py-4 font-display text-2xl font-semibold">
                        {group.label}
                      </LocalizedClientLink>
                    )}
                  </li>
                ))}
              </ul>

              <div className="px-5 py-5 flex flex-col gap-4 text-[15px]">
                <LocalizedClientLink href="/account" onClick={close} className="flex items-center gap-3" data-testid="account-link">
                  <UserIcon /> My account & orders
                </LocalizedClientLink>
                <a href={BRAND.whatsapp} target="_blank" rel="noreferrer" className="flex items-center gap-3">
                  <WhatsAppIcon /> Chat with us on WhatsApp
                </a>
                <LocalizedClientLink href="/pages/size-guide" onClick={close} className="text-ink-soft">Size guide</LocalizedClientLink>
                <LocalizedClientLink href="/pages/shipping-returns" onClick={close} className="text-ink-soft">Shipping & returns</LocalizedClientLink>
              </div>

              <div className="mt-auto bg-sand px-5 py-5 grid grid-cols-2 gap-3 text-[12px]">
                {PROMISES.map((p) => (
                  <div key={p.title}>
                    <p className="font-semibold">{p.title}</p>
                    <p className="text-ink-muted">{p.text}</p>
                  </div>
                ))}
              </div>
            </DialogPanel>
          </TransitionChild>
        </Dialog>
      </Transition>
    </div>
  )
}

export default SideMenu
