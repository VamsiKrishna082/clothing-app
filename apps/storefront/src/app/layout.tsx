import { getBaseURL } from "@lib/util/env"
import { Metadata, Viewport } from "next"
import { Cormorant_Garamond, Manrope } from "next/font/google"
import "styles/globals.css"

// Self-hosted at build time by next/font — no layout shift, no third-party request.
const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
})
const sans = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
  title: {
    default: "Tharam — Quality clothing, woven in India",
    template: "%s · Tharam",
  },
  description:
    "Kanjivaram sarees, kurtas, dresses, shirts and Tiruppur cotton essentials. Free shipping above ₹999, Cash on Delivery and easy 7-day returns.",
}

export const viewport: Viewport = {
  themeColor: "#FBF7F1",
}

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" data-mode="light" className={`${display.variable} ${sans.variable}`}>
      <body className="bg-ivory text-ink font-sans antialiased">
        <main className="relative">{props.children}</main>
      </body>
    </html>
  )
}
