/**
 * Demo catalogue for Tharam — categories, collections, ~30 products with
 * INR prices, stock at the Tiruppur warehouse, fabric details and a festive
 * sale price list.
 *
 *   npm run seed            (from apps/backend)
 *
 * Re-running is safe: categories, collections and products are matched by
 * handle and skipped when they already exist. Photos are Unsplash demo images
 * — replace them with your own product shots before launch.
 */
import type { ExecArgs } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
  ProductStatus,
} from "@medusajs/framework/utils"
import {
  createCollectionsWorkflow,
  createInventoryLevelsWorkflow,
  createPriceListsWorkflow,
  createProductCategoriesWorkflow,
  createProductsWorkflow,
} from "@medusajs/medusa/core-flows"

const img = (id: string) =>
  `https://images.unsplash.com/photo-${id}?w=1200&q=80&fit=crop&ar=3:4`

type Fabric = {
  fabric: string
  weave?: string
  gsm?: string
  fit?: string
  origin?: string
  care: string
  model_size?: string
}

type SeedProduct = {
  handle: string
  title: string
  subtitle: string
  description: string
  categories: string[]
  collection?: string
  images: string[]
  sizes: string[]
  colours: string[]
  price: number
  sale?: number
  weight: number
  details: Fabric
}

const WOMEN_SIZES = ["XS", "S", "M", "L", "XL", "XXL"]
const MEN_SIZES = ["S", "M", "L", "XL", "XXL"]
const SHIRT_SIZES = ["38", "40", "42", "44"]
const WAIST = ["28", "30", "32", "34", "36"]
const KIDS = ["2-3Y", "4-5Y", "6-7Y", "8-9Y"]
const FREE = ["Free Size"]

const CATEGORIES: { handle: string; name: string; parent?: string; description: string }[] = [
  { handle: "women", name: "Women", description: "Sarees, kurtas, dresses and everyday wear." },
  { handle: "men", name: "Men", description: "Shirts, tees, suits and denim." },
  { handle: "kids", name: "Kids", description: "Soft, playful cotton for little ones." },
  { handle: "sarees", name: "Sarees", parent: "women", description: "Silk and soft-silk sarees woven in Tamil Nadu." },
  { handle: "kurtas-suits", name: "Kurtas & Suits", parent: "women", description: "Anarkalis, kurta sets and salwar suits." },
  { handle: "dresses", name: "Dresses", parent: "women", description: "Maxis, midis and party gowns." },
  { handle: "tops-coords", name: "Tops & Co-ords", parent: "women", description: "Tees, co-ord sets and layers." },
  { handle: "bottoms", name: "Bottoms", parent: "women", description: "Joggers, jeans and trousers." },
  { handle: "shirts", name: "Shirts", parent: "men", description: "Formal and casual cotton shirts." },
  { handle: "t-shirts", name: "T-Shirts & Sweatshirts", parent: "men", description: "Tiruppur cotton tees and sweats." },
  { handle: "suits-jackets", name: "Suits & Jackets", parent: "men", description: "Tailored suits, blazers and jackets." },
  { handle: "jeans", name: "Jeans", parent: "men", description: "Selvedge and stretch denim." },
]

const COLLECTIONS = [
  { handle: "festive-edit", title: "Festive Edit" },
  { handle: "new-arrivals", title: "New Arrivals" },
  { handle: "everyday-cotton", title: "Everyday Cotton" },
  { handle: "bestsellers", title: "Bestsellers" },
]

const PRODUCTS: SeedProduct[] = [
  // ── Women · Sarees ────────────────────────────────────────────────
  {
    handle: "kanjivaram-silk-saree-wine-gold",
    title: "Kanjivaram Silk Saree",
    subtitle: "Wine & antique gold zari",
    description:
      "A pure silk Kanjivaram with a contrast gold zari border and rich pallu, woven by master weavers in Kanchipuram. Comes with an unstitched blouse piece.",
    categories: ["sarees"],
    collection: "festive-edit",
    images: [img("1610030469983-98e550d6193c")],
    sizes: FREE,
    colours: ["Wine"],
    price: 7499,
    weight: 800,
    details: { fabric: "Pure mulberry silk with zari", weave: "Kanjivaram (korvai border)", origin: "Kanchipuram, Tamil Nadu", care: "Dry clean only. Store wrapped in muslin.", fit: "5.5 m saree + 0.8 m blouse piece" },
  },
  {
    handle: "soft-silk-saree-ruby",
    title: "Soft Silk Saree",
    subtitle: "Ruby red with butta motifs",
    description:
      "Feather-light soft silk with gold butta all over and a temple border. Drapes beautifully for weddings and pujas without the weight of traditional silk.",
    categories: ["sarees"],
    collection: "festive-edit",
    images: [img("1617627143750-d86bc21e42bb")],
    sizes: FREE,
    colours: ["Ruby"],
    price: 4299,
    sale: 3699,
    weight: 600,
    details: { fabric: "Soft silk blend", weave: "Jacquard butta", origin: "Arani, Tamil Nadu", care: "Dry clean recommended.", fit: "5.5 m saree + 0.8 m blouse piece" },
  },
  // ── Women · Kurtas & Suits ───────────────────────────────────────
  {
    handle: "chikankari-anarkali-set-ivory",
    title: "Chikankari Anarkali Set",
    subtitle: "Ivory with sheer dupatta",
    description:
      "A floor-length anarkali with hand chikankari, a flared sharara and a sheer embroidered dupatta. Fully lined for comfort through long celebrations.",
    categories: ["kurtas-suits"],
    collection: "festive-edit",
    images: [img("1583391733956-3750e0ff4e8b")],
    sizes: WOMEN_SIZES,
    colours: ["Ivory"],
    price: 3499,
    weight: 700,
    details: { fabric: "Georgette with cotton lining", weave: "Hand chikankari", origin: "Lucknow", care: "Gentle hand wash cold or dry clean.", model_size: "Model is 5'6\" and wears S" },
  },
  {
    handle: "printed-cotton-kurta-set-emerald",
    title: "Printed Cotton Kurta Set",
    subtitle: "Emerald with contrast dupatta",
    description:
      "An everyday-to-occasion kurta set in breathable cotton with a hand-block inspired print, straight pants and a vivid dupatta.",
    categories: ["kurtas-suits"],
    collection: "everyday-cotton",
    images: [img("1597983073493-88cd35cf93b0")],
    sizes: WOMEN_SIZES,
    colours: ["Emerald"],
    price: 1899,
    sale: 1499,
    weight: 500,
    details: { fabric: "100% cotton", weave: "Cambric", gsm: "120", origin: "Jaipur", care: "Machine wash cold, dry in shade.", model_size: "Model is 5'5\" and wears S" },
  },
  // ── Women · Dresses ──────────────────────────────────────────────
  {
    handle: "tiered-maxi-dress-peach",
    title: "Tiered Maxi Dress",
    subtitle: "Peach, flutter sleeves",
    description: "A flowy tiered maxi with flutter sleeves and a tie waist. Easy brunch-to-evening dressing.",
    categories: ["dresses"],
    collection: "new-arrivals",
    images: [img("1596783074918-c84cb06531ca")],
    sizes: WOMEN_SIZES,
    colours: ["Peach"],
    price: 1799,
    weight: 400,
    details: { fabric: "Viscose crepe", fit: "Relaxed", origin: "Tiruppur", care: "Hand wash cold.", model_size: "Model is 5'7\" and wears S" },
  },
  {
    handle: "georgette-wrap-maxi-teal",
    title: "Georgette Wrap Maxi",
    subtitle: "Teal, ruffle hem",
    description: "A full-sleeve wrap maxi in fluid georgette with a ruffled hem that moves with you.",
    categories: ["dresses"],
    collection: "new-arrivals",
    images: [img("1609357605129-26f69add5d6e")],
    sizes: WOMEN_SIZES,
    colours: ["Teal"],
    price: 2199,
    weight: 450,
    details: { fabric: "Poly georgette with lining", fit: "Wrap, adjustable", care: "Hand wash cold or dry clean." },
  },
  {
    handle: "floral-satin-gown",
    title: "Floral Satin Gown",
    subtitle: "Rose print, halter neck",
    description: "A dramatic halter-neck gown in printed satin with a sweeping skirt — made for sangeets and receptions.",
    categories: ["dresses"],
    collection: "festive-edit",
    images: [img("1622122201714-77da0ca8e5d2")],
    sizes: WOMEN_SIZES,
    colours: ["Rose"],
    price: 3999,
    weight: 650,
    details: { fabric: "Satin with tulle underlayer", fit: "Fitted bodice, flared skirt", care: "Dry clean only." },
  },
  {
    handle: "flared-midi-dress-scarlet",
    title: "Flared Midi Dress",
    subtitle: "Scarlet, open back",
    description: "Our bestselling twirl dress: a sleeveless scarlet midi with a full circle skirt.",
    categories: ["dresses"],
    collection: "bestsellers",
    images: [img("1595777457583-95e059d581b8")],
    sizes: WOMEN_SIZES,
    colours: ["Scarlet"],
    price: 2499,
    weight: 450,
    details: { fabric: "Crepe", fit: "Fit & flare", care: "Hand wash cold." },
  },
  {
    handle: "floral-fit-flare-dress",
    title: "Floral Fit & Flare Dress",
    subtitle: "Red print with belt",
    description: "A cheerful printed cotton dress with a self belt and cap sleeves.",
    categories: ["dresses"],
    collection: "everyday-cotton",
    images: [img("1572804013309-59a88b7e92f1")],
    sizes: WOMEN_SIZES,
    colours: ["Red Floral"],
    price: 1599,
    sale: 1299,
    weight: 380,
    details: { fabric: "100% cotton poplin", gsm: "110", origin: "Tiruppur", care: "Machine wash cold." },
  },
  {
    handle: "off-shoulder-bodycon-plum",
    title: "Off-Shoulder Bodycon",
    subtitle: "Plum stretch jersey",
    description: "A sleek off-shoulder dress in a soft stretch jersey for evenings out.",
    categories: ["dresses"],
    images: [img("1566174053879-31528523f8ae")],
    sizes: WOMEN_SIZES,
    colours: ["Plum"],
    price: 1999,
    weight: 350,
    details: { fabric: "Viscose-elastane jersey", fit: "Bodycon", care: "Hand wash cold, dry flat." },
  },
  {
    handle: "tailored-sheath-dress-grey",
    title: "Tailored Sheath Dress",
    subtitle: "Dove grey",
    description: "A clean-lined, knee-length sheath that works from boardroom to dinner.",
    categories: ["dresses"],
    images: [img("1617922001439-4a2e6562f328")],
    sizes: WOMEN_SIZES,
    colours: ["Dove Grey"],
    price: 1899,
    weight: 380,
    details: { fabric: "Poly-viscose suiting", fit: "Tailored", care: "Dry clean recommended." },
  },
  // ── Women · Tops & Co-ords / Bottoms ─────────────────────────────
  {
    handle: "fleece-coord-set-sunflower",
    title: "Fleece Co-ord Set",
    subtitle: "Sunflower yellow",
    description: "A cropped hoodie and jogger set in brushed-back fleece. Lounge, travel, repeat.",
    categories: ["tops-coords"],
    collection: "new-arrivals",
    images: [img("1515886657613-9f3515b0c78f")],
    sizes: WOMEN_SIZES,
    colours: ["Sunflower"],
    price: 2299,
    weight: 700,
    details: { fabric: "Cotton-poly fleece", gsm: "300", origin: "Tiruppur", care: "Machine wash cold, inside out." },
  },
  {
    handle: "checked-blazer-women",
    title: "Checked Wool-Blend Blazer",
    subtitle: "Forest green check",
    description: "A relaxed, single-breasted blazer in a soft wool blend — throw it over anything.",
    categories: ["tops-coords"],
    images: [img("1485968579580-b6d095142e6e")],
    sizes: WOMEN_SIZES,
    colours: ["Forest Check"],
    price: 3299,
    weight: 800,
    details: { fabric: "Wool-blend twill", fit: "Relaxed", care: "Dry clean only." },
  },
  {
    handle: "crochet-poncho-natural",
    title: "Crochet Poncho",
    subtitle: "Natural, fringed hem",
    description: "A handmade crochet poncho with a fringed hem. Layer it over tees and dresses.",
    categories: ["tops-coords"],
    images: [img("1434389677669-e08b4cac3105")],
    sizes: FREE,
    colours: ["Natural"],
    price: 1199,
    weight: 300,
    details: { fabric: "100% cotton yarn", weave: "Hand crochet", care: "Hand wash cold, dry flat." },
  },
  {
    handle: "graphic-crop-tee-women",
    title: "Graphic Crop Tee",
    subtitle: "Black, peace print",
    description: "A boxy cropped tee in heavyweight cotton with a hand-drawn front print.",
    categories: ["tops-coords"],
    collection: "everyday-cotton",
    images: [img("1503342217505-b0a15ec3261c")],
    sizes: WOMEN_SIZES,
    colours: ["Black"],
    price: 599,
    weight: 200,
    details: { fabric: "100% combed cotton", gsm: "200", origin: "Tiruppur", care: "Machine wash cold, inside out." },
  },
  {
    handle: "linen-jogger-trousers-blush",
    title: "Linen Jogger Trousers",
    subtitle: "Blush pink",
    description: "Cuffed joggers in a linen blend with patch pockets. Breathable for Indian summers.",
    categories: ["bottoms"],
    collection: "everyday-cotton",
    images: [img("1594633312681-425c7b97ccd1")],
    sizes: WOMEN_SIZES,
    colours: ["Blush"],
    price: 1299,
    weight: 350,
    details: { fabric: "Linen-cotton blend", fit: "Relaxed, elastic waist", care: "Machine wash cold." },
  },
  {
    handle: "distressed-slim-jeans-women",
    title: "Distressed Slim Jeans",
    subtitle: "Mid-wash indigo",
    description: "High-rise slim jeans with light distressing and enough stretch for all-day comfort.",
    categories: ["bottoms"],
    images: [img("1541099649105-f69ad21f3246")],
    sizes: ["26", "28", "30", "32", "34"],
    colours: ["Mid Indigo"],
    price: 1899,
    weight: 600,
    details: { fabric: "98% cotton, 2% elastane denim", fit: "Slim, high rise", care: "Wash inside out, cold." },
  },
  // ── Men ──────────────────────────────────────────────────────────
  {
    handle: "premium-cotton-formal-shirt",
    title: "Premium Cotton Formal Shirt",
    subtitle: "Giza cotton, spread collar",
    description:
      "Our signature office shirt in two-ply Giza cotton with a crisp spread collar and mother-of-pearl buttons. Non-iron finish.",
    categories: ["shirts"],
    collection: "bestsellers",
    images: [img("1602810316498-ab67cf68c8e1"), img("1602810318383-e386cc2a3ccf")],
    sizes: SHIRT_SIZES,
    colours: ["White", "Charcoal", "Burgundy"],
    price: 1499,
    weight: 300,
    details: { fabric: "100% Giza cotton, two-ply", weave: "Poplin", gsm: "110", fit: "Tailored", care: "Machine wash 30°C, warm iron.", model_size: "Model is 6'0\" and wears 40" },
  },
  {
    handle: "slim-chambray-shirt-sky",
    title: "Slim-Fit Chambray Shirt",
    subtitle: "Sky blue",
    description: "A soft chambray shirt that dresses up or down. Button-down collar, curved hem.",
    categories: ["shirts"],
    collection: "everyday-cotton",
    images: [img("1588359348347-9bc6cbbb689e")],
    sizes: SHIRT_SIZES,
    colours: ["Sky Blue"],
    price: 1399,
    weight: 280,
    details: { fabric: "100% cotton chambray", fit: "Slim", origin: "Tiruppur", care: "Machine wash cold." },
  },
  {
    handle: "supima-crew-tee",
    title: "Supima Cotton Crew Tee",
    subtitle: "The everyday essential",
    description:
      "Knitted in Tiruppur from long-staple Supima cotton — soft, breathable and it keeps its shape wash after wash.",
    categories: ["t-shirts"],
    collection: "bestsellers",
    images: [img("1521572163474-6864f9cf17ab"), img("1562157873-818bc0726f68")],
    sizes: MEN_SIZES,
    colours: ["White", "Black", "Navy", "Maroon", "Mustard"],
    price: 699,
    weight: 180,
    details: { fabric: "100% Supima cotton", weave: "Single jersey", gsm: "180", fit: "Regular", origin: "Tiruppur", care: "Machine wash cold, tumble dry low.", model_size: "Model is 6'1\" and wears M" },
  },
  {
    handle: "heavyweight-tee-black",
    title: "Heavyweight Tee",
    subtitle: "Black, 240 GSM",
    description: "A structured, boxy tee in dense 240 GSM cotton with a small chest print.",
    categories: ["t-shirts"],
    images: [img("1618354691373-d851c5c3a990")],
    sizes: MEN_SIZES,
    colours: ["Black"],
    price: 799,
    weight: 240,
    details: { fabric: "100% combed cotton", gsm: "240", fit: "Boxy", origin: "Tiruppur", care: "Machine wash cold, inside out." },
  },
  {
    handle: "lucky-cat-graphic-tee",
    title: "Lucky Cat Graphic Tee",
    subtitle: "Ecru, screen printed",
    description: "A relaxed tee with a bold screen-printed Maneki-neko graphic.",
    categories: ["t-shirts"],
    collection: "new-arrivals",
    images: [img("1576566588028-4147f3842f27")],
    sizes: MEN_SIZES,
    colours: ["Ecru"],
    price: 899,
    sale: 699,
    weight: 200,
    details: { fabric: "100% cotton", gsm: "200", fit: "Relaxed", care: "Machine wash cold, do not iron print." },
  },
  {
    handle: "cotton-sweatshirt-off-white",
    title: "Brushed Cotton Sweatshirt",
    subtitle: "Off-white",
    description: "A clean crewneck sweatshirt with a brushed interior and ribbed trims.",
    categories: ["t-shirts"],
    collection: "everyday-cotton",
    images: [img("1620799140408-edc6dcb6d633")],
    sizes: MEN_SIZES,
    colours: ["Off-White"],
    price: 1299,
    weight: 450,
    details: { fabric: "Cotton-rich fleece", gsm: "320", origin: "Tiruppur", care: "Machine wash cold." },
  },
  {
    handle: "navy-two-piece-suit",
    title: "Navy Two-Piece Suit",
    subtitle: "Slim fit, notch lapel",
    description: "A sharp navy suit in a breathable poly-viscose suiting — weddings, interviews and everything between.",
    categories: ["suits-jackets"],
    collection: "festive-edit",
    images: [img("1617137968427-85924c800a22"), img("1507679799987-c73779587ccf")],
    sizes: ["36", "38", "40", "42", "44"],
    colours: ["Navy"],
    price: 8999,
    weight: 1400,
    details: { fabric: "Poly-viscose suiting", fit: "Slim", care: "Dry clean only.", model_size: "Model is 6'0\" and wears 40" },
  },
  {
    handle: "windowpane-three-piece-suit",
    title: "Windowpane Three-Piece Suit",
    subtitle: "Cobalt check",
    description: "A statement three-piece with a waistcoat, in a cobalt windowpane check.",
    categories: ["suits-jackets"],
    images: [img("1594938298603-c8148c4dae35")],
    sizes: ["36", "38", "40", "42", "44"],
    colours: ["Cobalt Check"],
    price: 11999,
    sale: 9999,
    weight: 1700,
    details: { fabric: "Wool-blend suiting", fit: "Tailored", care: "Dry clean only." },
  },
  {
    handle: "rust-bomber-jacket",
    title: "Bomber Jacket",
    subtitle: "Rust, lightweight",
    description: "A lightweight bomber with ribbed cuffs — the one layer you need for Bengaluru evenings.",
    categories: ["suits-jackets"],
    collection: "new-arrivals",
    images: [img("1591047139829-d91aecb6caea")],
    sizes: MEN_SIZES,
    colours: ["Rust"],
    price: 2799,
    weight: 600,
    details: { fabric: "Nylon shell, polyester lining", fit: "Regular", care: "Machine wash cold, gentle." },
  },
  {
    handle: "selvedge-straight-jeans",
    title: "Selvedge Straight Jeans",
    subtitle: "Raw indigo",
    description: "Straight-leg jeans in 13 oz selvedge denim that fades to fit you.",
    categories: ["jeans"],
    collection: "bestsellers",
    images: [img("1542272604-787c3835535d"), img("1624378439575-d8705ad7ae80")],
    sizes: WAIST,
    colours: ["Raw Indigo"],
    price: 2199,
    weight: 800,
    details: { fabric: "100% cotton selvedge denim, 13 oz", fit: "Straight", care: "Wash rarely, inside out, cold." },
  },
  // ── Kids ─────────────────────────────────────────────────────────
  {
    handle: "kids-cardigan-bow-set",
    title: "Little Gent Cardigan Set",
    subtitle: "Navy cardigan & bow tie",
    description: "A soft knit cardigan with a matching bow tie for birthdays and family functions.",
    categories: ["kids"],
    collection: "festive-edit",
    images: [img("1519238263530-99bdd11df2ea")],
    sizes: KIDS,
    colours: ["Navy"],
    price: 1099,
    weight: 300,
    details: { fabric: "Cotton knit", care: "Hand wash cold." },
  },
  {
    handle: "kids-everyday-tee-pack",
    title: "Kids Everyday Tee — Pack of 2",
    subtitle: "Grey print + henley",
    description: "Two soft, tag-free tees for school, play and everything else.",
    categories: ["kids"],
    collection: "everyday-cotton",
    images: [img("1503944583220-79d8926ad5e2")],
    sizes: KIDS,
    colours: ["Grey Mix"],
    price: 799,
    weight: 300,
    details: { fabric: "100% cotton", gsm: "160", origin: "Tiruppur", care: "Machine wash cold." },
  },
  {
    handle: "baby-organic-cotton-tee",
    title: "Baby Organic Cotton Tee",
    subtitle: "Milk white",
    description: "GOTS organic cotton, nickel-free snaps and nothing scratchy — gentle on new skin.",
    categories: ["kids"],
    images: [img("1622290291468-a28f7a7dc6a8")],
    sizes: ["0-6M", "6-12M", "12-18M", "18-24M"],
    colours: ["Milk White"],
    price: 449,
    weight: 120,
    details: { fabric: "GOTS organic cotton", gsm: "160", origin: "Tiruppur", care: "Machine wash cold, mild detergent." },
  },
]

/** SKUs seeded with low stock, so the low-stock board has something to show. */
const LOW_STOCK_HANDLES = new Set(["kanjivaram-silk-saree-wine-gold", "floral-satin-gown", "navy-two-piece-suit"])

const skuPart = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]+/g, "")

export default async function seedCatalog({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const { data: salesChannels } = await query.graph({ entity: "sales_channel", fields: ["id", "name"] })
  const { data: shippingProfiles } = await query.graph({ entity: "shipping_profile", fields: ["id"] })
  const { data: locations } = await query.graph({ entity: "stock_location", fields: ["id", "name"] })
  const { data: regions } = await query.graph({ entity: "region", fields: ["id", "currency_code"] })

  const salesChannel = salesChannels[0]
  const shippingProfile = shippingProfiles[0]
  const location = locations[0]
  if (!salesChannel || !shippingProfile || !location || !regions.some((r) => r.currency_code === "inr")) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Store setup missing — run `npx medusa db:migrate` first.")
  }

  // ── Categories (parents first) ──────────────────────────────────
  const categoryId = new Map<string, string>()
  const loadCategories = async () => {
    const { data } = await query.graph({ entity: "product_category", fields: ["id", "handle"] })
    data.forEach((c) => categoryId.set(c.handle as string, c.id as string))
  }
  await loadCategories()
  for (const level of [CATEGORIES.filter((c) => !c.parent), CATEGORIES.filter((c) => c.parent)]) {
    const missing = level.filter((c) => !categoryId.has(c.handle))
    if (!missing.length) continue
    await createProductCategoriesWorkflow(container).run({
      input: {
        product_categories: missing.map((c, i) => ({
          name: c.name,
          handle: c.handle,
          description: c.description,
          is_active: true,
          rank: i,
          ...(c.parent ? { parent_category_id: categoryId.get(c.parent) } : {}),
        })),
      },
    })
    await loadCategories()
  }

  // ── Collections ─────────────────────────────────────────────────
  const collectionId = new Map<string, string>()
  const loadCollections = async () => {
    const { data } = await query.graph({ entity: "product_collection", fields: ["id", "handle"] })
    data.forEach((c) => collectionId.set(c.handle as string, c.id as string))
  }
  await loadCollections()
  const missingCollections = COLLECTIONS.filter((c) => !collectionId.has(c.handle))
  if (missingCollections.length) {
    await createCollectionsWorkflow(container).run({ input: { collections: missingCollections } })
    await loadCollections()
  }

  // ── Products ────────────────────────────────────────────────────
  const { data: existing } = await query.graph({ entity: "product", fields: ["handle"] })
  const taken = new Set(existing.map((p) => p.handle))
  const toCreate = PRODUCTS.filter((p) => !taken.has(p.handle))

  for (let i = 0; i < toCreate.length; i += 10) {
    const batch = toCreate.slice(i, i + 10)
    await createProductsWorkflow(container).run({
      input: {
        products: batch.map((p) => ({
          title: p.title,
          subtitle: p.subtitle,
          handle: p.handle,
          description: p.description,
          status: ProductStatus.PUBLISHED,
          thumbnail: p.images[0],
          images: p.images.map((url) => ({ url })),
          weight: p.weight,
          origin_country: "in",
          material: p.details.fabric,
          shipping_profile_id: shippingProfile.id,
          sales_channels: [{ id: salesChannel.id }],
          // The product's own category plus its parent, so /categories/women lists every women's product.
          category_ids: [...new Set(p.categories.flatMap((h) => [h, CATEGORIES.find((c) => c.handle === h)?.parent]).filter(Boolean))].map(
            (h) => categoryId.get(h as string)!
          ),
          collection_id: p.collection ? collectionId.get(p.collection) : undefined,
          metadata: { ...p.details },
          options: [
            { title: "Size", values: p.sizes },
            { title: "Colour", values: p.colours },
          ],
          variants: p.colours.flatMap((colour) =>
            p.sizes.map((size) => ({
              title: `${size} / ${colour}`,
              sku: `TH-${skuPart(p.handle).slice(0, 14)}-${skuPart(colour).slice(0, 4)}-${skuPart(size)}`,
              options: { Size: size, Colour: colour },
              manage_inventory: true,
              prices: [{ amount: p.price, currency_code: "inr" }],
            }))
          ),
        })),
      },
    })
    logger.info(`Created ${Math.min(i + 10, toCreate.length)}/${toCreate.length} products`)
  }

  // ── Stock at the warehouse ─────────────────────────────────────
  const { data: products } = await query.graph({
    entity: "product",
    fields: ["handle", "variants.id", "variants.sku", "variants.inventory_items.inventory_item_id", "variants.inventory_items.inventory.location_levels.location_id"],
  })
  const levels: { inventory_item_id: string; location_id: string; stocked_quantity: number }[] = []
  for (const p of products) {
    for (const [n, v] of (p.variants ?? []).entries()) {
      for (const link of v?.inventory_items ?? []) {
        const stocked = (link?.inventory as any)?.location_levels?.some((l: any) => l?.location_id === location.id)
        if (!link?.inventory_item_id || stocked) continue
        const low = LOW_STOCK_HANDLES.has(p.handle as string)
        levels.push({
          inventory_item_id: link.inventory_item_id,
          location_id: location.id,
          stocked_quantity: low ? 2 + (n % 3) : 12 + ((n * 7) % 25),
        })
      }
    }
  }
  if (levels.length) {
    await createInventoryLevelsWorkflow(container).run({ input: { inventory_levels: levels } })
    logger.info(`Stocked ${levels.length} SKUs at ${location.name}`)
  }

  // ── Festive sale price list ─────────────────────────────────────
  const { data: priceLists } = await query.graph({ entity: "price_list", fields: ["id", "title"] })
  if (!priceLists.some((pl) => pl.title === "Festive Sale")) {
    const saleByHandle = new Map(PRODUCTS.filter((p) => p.sale).map((p) => [p.handle, p.sale!]))
    const prices = products.flatMap((p) =>
      saleByHandle.has(p.handle as string)
        ? (p.variants ?? []).map((v) => ({ variant_id: v!.id as string, amount: saleByHandle.get(p.handle as string)!, currency_code: "inr" }))
        : []
    )
    // `type` is accepted (and stored) by the workflow but missing from its input DTO type,
    // so the data goes through a variable rather than an object literal.
    const festiveSale = {
      title: "Festive Sale",
      description: "Diwali festive offers",
      type: "sale",
      status: "active" as const,
      prices,
    }
    await createPriceListsWorkflow(container).run({
      input: { price_lists_data: [festiveSale] },
    })
    logger.info(`Festive Sale price list: ${prices.length} variant prices`)
  }

  // ── Search index ───────────────────────────────────────────────
  // product.created is handled asynchronously; replay it so a short-lived exec
  // doesn't exit before the index has every product. Ingest upserts.
  const search = container.resolve(Modules.SEARCH)
  const { data: all } = await query.graph({ entity: "product", fields: ["id"] })
  try {
    for (let i = 0; i < all.length; i += 25) {
      await search.ingest({ name: "product.created", data: all.slice(i, i + 25).map((p) => ({ id: p.id })) } as never)
    }
  } catch (e) {
    // On a fresh database the index version is still "pending": the server
    // backfills every product into it on its first start.
    if (!/no active version/i.test((e as Error).message)) throw e
    logger.info("Search index not active yet — it will be backfilled when the server starts.")
  }
  logger.info(`Catalogue ready: ${all.length} products.`)
}
