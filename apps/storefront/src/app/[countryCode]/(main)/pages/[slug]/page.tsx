import { Metadata } from "next"
import { notFound } from "next/navigation"

import { BRAND } from "@lib/brand"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ListingHeader from "@modules/store/components/listing-header"

/**
 * Static content pages (/pages/*). Fully static — cached at the edge.
 * Privacy & terms are starting drafts: have them reviewed before launch.
 */
type Page = { title: string; description: string; body: React.ReactNode }

const Table = ({ head, rows }: { head: string[]; rows: (string | number)[][] }) => (
  <div className="overflow-x-auto rounded-xl border border-sand-dark">
    <table className="w-full text-left text-[14px]">
      <thead className="bg-sand">
        <tr>{head.map((h) => <th key={h} className="px-4 py-3 font-semibold">{h}</th>)}</tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={String(r[0])} className="border-t border-sand-dark bg-white">
            {r.map((c, i) => <td key={i} className={`px-4 py-3 ${i === 0 ? "font-semibold" : "text-ink-soft"}`}>{c}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)

const H2 = ({ children }: { children: React.ReactNode }) => (
  <h2 className="font-display text-3xl font-semibold mt-12 mb-4 first:mt-0">{children}</h2>
)

const PAGES: Record<string, Page> = {
  "our-story": {
    title: "Our story",
    description: "Tharam means quality. Here's what that means to us.",
    body: (
      <>
        <H2>தரம் — quality, honestly</H2>
        <p>
          Tharam began with a simple frustration: shopping online for clothes in India meant guessing. Is it really silk? How thick is
          the cotton? Will the colour run? We started Tharam to take the guesswork out — by working directly with weavers in
          Kanchipuram and Arani and knitting units in Tiruppur, and by telling you exactly what every piece is made of.
        </p>
        <H2>What we promise</H2>
        <ul className="list-disc pl-5 space-y-2">
          <li><b>Fabric transparency</b> — fabric, GSM, weave and origin listed on every product.</li>
          <li><b>Fair prices</b> — no inflated MRPs; our sale prices are real reductions.</li>
          <li><b>Easy returns</b> — {BRAND.returnDays}-day returns and exchanges, Cash on Delivery across India.</li>
        </ul>
      </>
    ),
  },
  "size-guide": {
    title: "Size guide",
    description: "Body measurements in inches. Between sizes? Size up for a relaxed fit.",
    body: (
      <>
        <H2>Women — kurtas, dresses & tops</H2>
        <Table
          head={["Size", "Bust", "Waist", "Hip"]}
          rows={[["XS", 32, 26, 35], ["S", 34, 28, 37], ["M", 36, 30, 39], ["L", 38, 32, 41], ["XL", 40, 34, 43], ["XXL", 42, 36, 45]]}
        />
        <H2>Men — T-shirts & sweatshirts</H2>
        <Table head={["Size", "Chest", "Length", "Shoulder"]} rows={[["S", 38, 27, 17], ["M", 40, 28, 17.5], ["L", 42, 29, 18], ["XL", 44, 30, 18.5], ["XXL", 46, 31, 19]]} />
        <H2>Men — shirts & suits (collar / chest size)</H2>
        <Table head={["Size", "Chest", "Waist", "Sleeve"]} rows={[["36 / 38", 38, 32, 24], ["40", 40, 34, 24.5], ["42", 42, 36, 25], ["44", 44, 38, 25.5]]} />
        <H2>Jeans (waist)</H2>
        <Table head={["Size", "Waist", "Hip", "Inseam"]} rows={[["28", 28, 36, 30], ["30", 30, 38, 31], ["32", 32, 40, 32], ["34", 34, 42, 32], ["36", 36, 44, 32]]} />
        <H2>Kids</H2>
        <Table head={["Age", "Height (cm)", "Chest", "Waist"]} rows={[["2-3Y", "92–98", 21, 20], ["4-5Y", "104–110", 23, 21], ["6-7Y", "116–122", 25, 22], ["8-9Y", "128–134", 27, 23]]} />
        <p className="mt-6 text-ink-muted text-sm">Sarees are 5.5 m with a 0.8 m unstitched blouse piece.</p>
      </>
    ),
  },
  "shipping-returns": {
    title: "Shipping & returns",
    description: "Fast delivery across India, Cash on Delivery and easy returns.",
    body: (
      <>
        <H2>Shipping</H2>
        <ul className="list-disc pl-5 space-y-2">
          <li>Orders are dispatched within 24–48 hours from our Tiruppur warehouse.</li>
          <li>Standard delivery: 3–6 business days — <b>free above ₹{BRAND.freeShippingAbove}</b>, otherwise ₹79.</li>
          <li>Express delivery: 1–2 business days in metro cities — ₹149.</li>
          <li>Cash on Delivery is available on all serviceable pincodes.</li>
        </ul>
        <H2>Returns & exchanges</H2>
        <ul className="list-disc pl-5 space-y-2">
          <li>Return or exchange within <b>{BRAND.returnDays} days</b> of delivery.</li>
          <li>Items must be unworn, unwashed, with original tags and packaging.</li>
          <li>Sarees whose blouse piece has been cut, and innerwear, cannot be returned.</li>
          <li>Refunds for prepaid orders go back to the original payment method; COD refunds are made by bank transfer or UPI.</li>
        </ul>
        <p className="mt-6">
          Start a return from <LocalizedClientLink href="/account/orders" className="text-maroon underline">your orders</LocalizedClientLink> or message us on WhatsApp.
        </p>
      </>
    ),
  },
  contact: {
    title: "Contact us",
    description: "We usually reply within a few hours, Monday to Saturday.",
    body: (
      <>
        <H2>Talk to us</H2>
        <ul className="space-y-3">
          <li>WhatsApp: <a href={BRAND.whatsapp} className="text-maroon underline" target="_blank" rel="noreferrer">chat with us</a></li>
          <li>Email: <a href={`mailto:${BRAND.email}`} className="text-maroon underline">{BRAND.email}</a></li>
          <li>Hours: Mon–Sat, 10 am – 7 pm IST</li>
          <li>Warehouse: Textile Market Road, Tiruppur, Tamil Nadu 641601</li>
        </ul>
      </>
    ),
  },
  privacy: {
    title: "Privacy policy",
    description: "How Tharam collects and uses your information.",
    body: (
      <>
        <p>We collect only what we need to deliver your order and support you: your name, phone number, email, delivery address and order history.</p>
        <H2>How we use it</H2>
        <p>To process and deliver orders, send order updates (SMS, WhatsApp, email), handle returns and improve our store. We never sell your data.</p>
        <H2>Who we share it with</H2>
        <p>Only service providers needed to run the store — payment gateways, courier partners and messaging providers — under confidentiality obligations.</p>
        <H2>Your choices</H2>
        <p>You can ask us to update or delete your information at any time by writing to {BRAND.email}.</p>
      </>
    ),
  },
  terms: {
    title: "Terms of use",
    description: "The terms that apply when you shop with Tharam.",
    body: (
      <>
        <p>By using this website you agree to these terms. All prices are in Indian Rupees and include GST.</p>
        <H2>Orders</H2>
        <p>An order is confirmed when you receive a confirmation message. We may cancel an order if an item is unavailable or a pincode is not serviceable, with a full refund for prepaid orders.</p>
        <H2>Product information</H2>
        <p>We make every effort to show colours and details accurately; handwoven products can have small variations that are part of their character.</p>
        <H2>Governing law</H2>
        <p>These terms are governed by the laws of India, with courts in Tamil Nadu having jurisdiction.</p>
      </>
    ),
  },
}

type Props = { params: Promise<{ slug: string; countryCode: string }> }

export async function generateStaticParams() {
  return Object.keys(PAGES).map((slug) => ({ slug }))
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { slug } = await props.params
  const page = PAGES[slug]
  return page ? { title: page.title, description: page.description } : {}
}

export default async function ContentPage(props: Props) {
  const { slug } = await props.params
  const page = PAGES[slug]
  if (!page) notFound()

  return (
    <>
      <ListingHeader title={page.title} description={page.description} />
      <article className="content-container max-w-3xl py-12 small:py-16 text-[15px] leading-relaxed text-ink-soft">
        {page.body}
      </article>
    </>
  )
}
