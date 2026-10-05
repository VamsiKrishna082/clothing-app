import { BRAND, NAV } from "@lib/brand"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { CashIcon, ReturnIcon, ShieldIcon, TruckIcon, WhatsAppIcon } from "@modules/common/icons/line"

const HELP = [
  { label: "Shipping & returns", href: "/pages/shipping-returns" },
  { label: "Size guide", href: "/pages/size-guide" },
  { label: "Track my order", href: "/account/orders" },
  { label: "Contact us", href: "/pages/contact" },
]
const ABOUT = [
  { label: "Our story", href: "/pages/our-story" },
  { label: "Privacy policy", href: "/pages/privacy" },
  { label: "Terms of use", href: "/pages/terms" },
]

/** Static footer — no per-user data, so it caches with the page. */
export default function Footer() {
  return (
    <footer className="bg-ink text-ivory/80 mt-24">
      <div className="border-b border-ivory/10">
        <div className="content-container grid grid-cols-2 small:grid-cols-4 gap-6 py-8 text-[13px]">
          {[
            { Icon: TruckIcon, t: "Free shipping", s: `Above ₹${BRAND.freeShippingAbove}` },
            { Icon: CashIcon, t: "Cash on Delivery", s: "Across India" },
            { Icon: ReturnIcon, t: `${BRAND.returnDays}-day returns`, s: "Easy exchanges" },
            { Icon: ShieldIcon, t: "Secure payments", s: "UPI · Cards · Netbanking" },
          ].map(({ Icon, t, s }) => (
            <div key={t} className="flex items-center gap-3">
              <Icon size={26} className="text-gold shrink-0" />
              <div>
                <p className="text-ivory font-semibold">{t}</p>
                <p className="text-ivory/60">{s}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="content-container grid grid-cols-2 small:grid-cols-[1.4fr_1fr_1fr_1fr] gap-10 py-16">
        <div className="col-span-2 small:col-span-1 max-w-sm">
          <p className="font-display text-3xl font-semibold tracking-[0.18em] text-ivory">THARAM</p>
          <p className="text-sm text-gold mt-1">{BRAND.tamil}</p>
          <p className="mt-5 text-sm leading-relaxed">
            Tharam means quality. Sarees woven in Kanchipuram, cottons knitted in Tiruppur — every fabric listed honestly, every order packed with care.
          </p>
          <a
            href={BRAND.whatsapp}
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-flex items-center gap-2 rounded-full border border-ivory/25 px-5 h-11 text-sm text-ivory hover:bg-ivory hover:text-ink transition-colors"
          >
            <WhatsAppIcon size={18} /> Chat on WhatsApp
          </a>
        </div>

        <FooterCol title="Shop" links={NAV.map((n) => ({ label: n.label, href: n.href }))} />
        <FooterCol title="Help" links={HELP} />
        <FooterCol title="Tharam" links={ABOUT} />
      </div>

      <div className="border-t border-ivory/10">
        <div className="content-container flex flex-col small:flex-row gap-3 justify-between py-6 text-[12px] text-ivory/50">
          <p>© {new Date().getFullYear()} Tharam. Made with care in Tamil Nadu.</p>
          <p>Prices inclusive of GST · {BRAND.email}</p>
        </div>
      </div>
    </footer>
  )
}

function FooterCol({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <p className="text-ivory font-semibold text-sm mb-4">{title}</p>
      <ul className="flex flex-col gap-3 text-sm">
        {links.map((l) => (
          <li key={l.href}>
            <LocalizedClientLink href={l.href} className="hover:text-gold transition-colors">
              {l.label}
            </LocalizedClientLink>
          </li>
        ))}
      </ul>
    </div>
  )
}
