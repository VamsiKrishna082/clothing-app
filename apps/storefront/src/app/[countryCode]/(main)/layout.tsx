import { Metadata } from "next"

import { retrieveCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import { getBaseURL } from "@lib/util/env"
import CartMismatchBanner from "@modules/layout/components/cart-mismatch-banner"
import Footer from "@modules/layout/templates/footer"
import Nav from "@modules/layout/templates/nav"

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
}

// Free-shipping progress lives in the bag dropdown, so there's no popup nudge
// here (and no shipping-options request on every page render).
export default async function PageLayout(props: { children: React.ReactNode }) {
  const [customer, cart] = await Promise.all([retrieveCustomer(), retrieveCart()])

  return (
    <>
      <Nav />
      {customer && cart && <CartMismatchBanner customer={customer} cart={cart} />}
      {props.children}
      <Footer />
    </>
  )
}
