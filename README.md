# Tharam — clothing store

Customer storefront + admin console for **Tharam** (தரம் — "quality"), an India-first clothing brand.
Architecture, infra and cost plan: [`tharam-architecture.md`](./tharam-architecture.md).

| App | Path | Local URL | Stack |
|---|---|---|---|
| Storefront | `apps/storefront` | http://localhost:8000/in | Next.js 15 (App Router), Tailwind |
| Backend + Admin | `apps/backend` | http://localhost:9000 · admin at `/app` | Medusa v2, Postgres |

## What's built (phase 1)

**Storefront**
- Brand design: ivory / ink / kumkum maroon / temple gold, Cormorant + Manrope (self-hosted via `next/font`).
- Home: announcement bar, editorial hero, promises strip, shop-by-category tiles, collection rails, festive sale banner, brand story.
- Desktop mega-menu (Women / Men) and a mobile slide-in menu.
- Product cards with hover image swap, sale badge (% off), colour count.
- Product page: breadcrumb, swipe gallery on phones, size/colour pills (single-value options auto-selected), size guide link, "only N left" hint, delivery promises, Description / Fabric & care / Delivery accordions (fabric fields come from the admin).
- Bag dropdown with free-shipping progress; GST-inclusive Indian bill (items incl. GST, delivery, total, "Includes ₹X GST").
- Distraction-free checkout with Cash on Delivery.
- Category / collection / shop headers with sub-category chips and sort pills.
- Static pages: our story, size guide, shipping & returns, contact, privacy, terms (`/pages/*`; have privacy & terms reviewed before launch).
- Brand copy lives in [`apps/storefront/src/lib/brand.ts`](apps/storefront/src/lib/brand.ts).

**Backend / admin**
- India store setup: INR (tax-inclusive), India region, GST 5% tax region, Tiruppur warehouse, Standard ₹79 (free ≥ ₹999) and Express ₹149, COD via the system payment provider (`src/migration-scripts/initial-data-seed.ts`).
- Demo catalogue: 30 products, 174 SKUs, 12 categories, 4 collections, Festive Sale price list (`npm run seed`).
- Admin: **Fabric & quality** widget on products, **Low stock** page, **Sales at a glance** on Orders.
- Admin edits revalidate the storefront cache within seconds (`src/subscribers/revalidate-storefront.ts` → `storefront /api/revalidate`).
- Redis (Upstash) and Cloudflare R2 switch on automatically when `REDIS_URL` / `S3_BUCKET` are set; locally it's Postgres only.

## Run locally

Requires Node 22, Postgres 16.

```bash
npm install
createdb tharam
cp apps/backend/.env.template apps/backend/.env            # set DATABASE_URL, REVALIDATE_SECRET
cp apps/storefront/.env.template apps/storefront/.env.local # set publishable key + same REVALIDATE_SECRET

cd apps/backend
npx medusa db:migrate      # schema + India store setup
npm run dev                # first start activates the search index (leave running)
npm run seed               # in another terminal: demo catalogue
npx medusa user -e you@example.com -p <password>   # admin login

cd ../storefront && npm run dev   # http://localhost:8000/in
```

The publishable key is in Admin → Settings → Publishable API keys.

## Next phases

1. Razorpay (UPI/cards/netbanking), MSG91 phone OTP login, Shiprocket (pincode check, shipments, tracking), WhatsApp order updates, GST invoices.
2. Terraform + GitHub Actions deploy (Cloud Run, Cloud SQL, Upstash, R2, Cloudflare) per the architecture doc.
3. Reviews & wishlist modules; replace demo photos and sample reviews with real ones (sample reviews are hidden in production).
