/**
 * Tharam brand content in one place — navigation, promises, home tiles.
 * Edit here to change copy across the storefront. Category/collection
 * handles must match the ones in the backend (seed-catalog.ts / admin).
 */
const img = (id: string, w = 900) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&q=80&fit=crop`

export const BRAND = {
  name: "Tharam",
  tamil: "தரம்",
  tagline: "Quality you can feel",
  freeShippingAbove: 999,
  returnDays: 7,
  whatsapp: "https://wa.me/910000000000", // replace with the store's WhatsApp number
  email: "care@tharam.in",
}

export const ANNOUNCEMENTS = [
  `Free shipping on orders above ₹${BRAND.freeShippingAbove}`,
  "Cash on Delivery available across India",
  `Easy ${BRAND.returnDays}-day returns & exchanges`,
  "Festive Sale — up to 20% off selected styles",
]

export type NavGroup = {
  label: string
  href: string
  links: { label: string; href: string }[]
  feature?: { title: string; href: string; image: string }
}

export const NAV: NavGroup[] = [
  {
    label: "Women",
    href: "/categories/women",
    links: [
      { label: "Sarees", href: "/categories/sarees" },
      { label: "Kurtas & Suits", href: "/categories/kurtas-suits" },
      { label: "Dresses", href: "/categories/dresses" },
      { label: "Tops & Co-ords", href: "/categories/tops-coords" },
      { label: "Bottoms", href: "/categories/bottoms" },
      { label: "Shop all women", href: "/categories/women" },
    ],
    feature: { title: "The Saree Edit", href: "/categories/sarees", image: img("1617627143750-d86bc21e42bb", 600) },
  },
  {
    label: "Men",
    href: "/categories/men",
    links: [
      { label: "Shirts", href: "/categories/shirts" },
      { label: "T-Shirts & Sweatshirts", href: "/categories/t-shirts" },
      { label: "Suits & Jackets", href: "/categories/suits-jackets" },
      { label: "Jeans", href: "/categories/jeans" },
      { label: "Shop all men", href: "/categories/men" },
    ],
    feature: { title: "Occasion Suits", href: "/categories/suits-jackets", image: img("1617137968427-85924c800a22", 600) },
  },
  { label: "Kids", href: "/categories/kids", links: [] },
  { label: "Festive Edit", href: "/collections/festive-edit", links: [] },
  { label: "New In", href: "/collections/new-arrivals", links: [] },
]

export const PROMISES = [
  { icon: "truck", title: "Free shipping", text: `On orders above ₹${BRAND.freeShippingAbove}` },
  { icon: "cash", title: "Cash on Delivery", text: "Pay when it reaches you" },
  { icon: "return", title: `${BRAND.returnDays}-day returns`, text: "Easy exchanges, no fuss" },
  { icon: "thread", title: "Fabric-first", text: "Every fabric, GSM & weave listed" },
] as const

export const CATEGORY_TILES = [
  { label: "Sarees", href: "/categories/sarees", image: img("1610030469983-98e550d6193c") },
  { label: "Kurtas & Suits", href: "/categories/kurtas-suits", image: img("1597983073493-88cd35cf93b0") },
  { label: "Dresses", href: "/categories/dresses", image: img("1595777457583-95e059d581b8") },
  { label: "Men's Shirts", href: "/categories/shirts", image: img("1588359348347-9bc6cbbb689e") },
  { label: "Tees & Sweats", href: "/categories/t-shirts", image: img("1521572163474-6864f9cf17ab") },
  { label: "Kids", href: "/categories/kids", image: img("1519238263530-99bdd11df2ea") },
]

export const HERO = {
  eyebrow: "The Festive Edit · 2026",
  title: "Woven for the moments that matter",
  text: "Kanjivaram silks from Kanchipuram, hand-finished anarkalis and sharp occasion wear — made by people who care about every thread.",
  primary: { label: "Shop the Festive Edit", href: "/collections/festive-edit" },
  secondary: { label: "New arrivals", href: "/collections/new-arrivals" },
  image: img("1617627143750-d86bc21e42bb", 1400),
  imageAlt: "Woman in a ruby red silk saree with gold jewellery",
  featured: { title: "Soft Silk Saree", href: "/products/soft-silk-saree-ruby" },
}

export const STORY = {
  eyebrow: "Tharam · தரம் · quality",
  title: "We tell you exactly what you're wearing",
  text: "Every Tharam piece lists its fabric, GSM, weave and where it was made. Our cottons are knitted in Tiruppur, our silks woven in Kanchipuram and Arani — so you know the quality before it reaches your door.",
  cta: { label: "Our story", href: "/pages/our-story" },
  image: img("1490481651871-ab68de25d43d", 1200),
  stats: [
    { value: "100%", label: "fabric transparency" },
    { value: "7 days", label: "easy returns" },
    { value: "₹999+", label: "free shipping" },
  ],
}

/**
 * SAMPLE copy for local design work only — the home page hides this section in
 * production. Replace with real customer reviews (reviews module) before launch.
 */
export const SHOW_SAMPLE_REVIEWS = process.env.NODE_ENV !== "production"
export const REVIEWS = [
  { name: "Priya S.", city: "Chennai", text: "The Kanjivaram is even richer in person. Zari is bright and the blouse piece was generous. Delivered in 3 days with COD!", rating: 5 },
  { name: "Arjun M.", city: "Bengaluru", text: "Finally a formal shirt that stays crisp through a 10-hour day. Ordered two more colours.", rating: 5 },
  { name: "Divya R.", city: "Coimbatore", text: "Loved that the GSM and fabric are written on the page. The kurta set is soft and the colours didn't bleed.", rating: 5 },
]
