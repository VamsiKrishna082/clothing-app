# Tharam — Store Platform Architecture & Terraform

Customer storefront + admin panel on a cheap, fast, fully Terraformed stack.

> "Tharam" and `tharam.in` are placeholders — replace with your final brand and domain.
> Prices are estimates as of Oct 2026. Verify in the GCP pricing calculator and provider pricing pages before committing.

---

## 0. TL;DR

| Layer | Choice | Why |
|---|---|---|
| Edge | **Cloudflare (Free)** — DNS, CDN, WAF, rate limiting, Zero Trust Access | Free global CDN + security; protects the admin panel at no cost |
| Customer panel | **Next.js (App Router)** on **Cloud Run** | ISR pages cached at the edge → instant browsing |
| Commerce backend + Admin panel | **Medusa.js v2** on **Cloud Run** | Products, variants, inventory, prices, carts, orders, returns, promotions and a full admin UI out of the box |
| Database | **Cloud SQL Postgres 16** (`db-f1-micro`) | Managed backups + point-in-time recovery, cheapest managed tier |
| Cache / events | **Upstash Redis** (serverless, Mumbai) | Pay-per-request, free tier at launch |
| Product images | **Cloudflare R2** + `media.` subdomain | S3-compatible, **zero egress fees** |
| Routing | **GCP Global HTTPS LB** + **Cloud Armor** (Cloudflare-only) | One entry point, Cloud Run not reachable except via Cloudflare |
| Payments | **Razorpay** (UPI, cards, netbanking) + COD | |
| Login | Phone **OTP via MSG91** | Passwordless, what Indian shoppers expect |
| Messaging | WhatsApp Cloud API (order updates), Resend/SES (email) | |
| Shipping | Shiprocket API | COD + pickup + tracking |
| IaC / CI | **Terraform** + **GitHub Actions** (keyless via Workload Identity Federation) | Everything reproducible; no JSON keys anywhere |
| Region | **asia-south1 (Mumbai)** | Lowest latency to Chennai / South India |

Estimated infra cost: **~₹6,000–9,000/month** in "smooth" production mode, **~₹3,000–4,000/month** in lean mode, staging ≈ ₹0–300. Payment gateway fees (~2.36% on prepaid orders) are separate and are your biggest cost. See §15.

---

## 1. Principles

1. **Fast by default** — catalog pages are pre-rendered and served from Cloudflare's edge; only cart/checkout/account hit the origin.
2. **Pay for usage, not idle** — Cloud Run, Upstash, R2 all scale with traffic. Two small always-warm instances are the only "idle" spend, and that is what buys smoothness (no cold starts at checkout).
3. **Buy, don't build, the commerce core** — Medusa gives inventory, pricing, orders, returns, promotions and the admin panel. You only build India-specific modules (OTP, Razorpay, Shiprocket, WhatsApp, GST).
4. **Everything in Terraform** — infra, DNS, WAF, cache rules, admin access policy, monitoring, budgets.
5. **Admin is never public** — the admin panel sits behind Cloudflare Access (staff email OTP) *and* Medusa's own login.

---

## 2. Architecture diagram

```mermaid
flowchart LR
  C[Customer browser / phone] -->|HTTPS| CF
  S[Staff browser] -->|HTTPS| CF

  subgraph CF[Cloudflare Free]
    DNS[DNS + CDN cache]
    WAF[WAF + rate limits]
    ACC[Zero Trust Access<br/>admin.tharam.in]
    R2[(R2 bucket<br/>media.tharam.in)]
  end

  CF -->|www / apex / api / admin| LB[GCP Global HTTPS LB<br/>+ Cloud Armor: Cloudflare IPs only]

  subgraph GCP[GCP asia-south1]
    LB --> SF[Cloud Run<br/>storefront - Next.js]
    LB --> BE[Cloud Run<br/>Medusa API + Admin]
    JOB[Cloud Run Job<br/>db migrations]
    SQL[(Cloud SQL<br/>Postgres 16)]
    SM[Secret Manager]
    AR[Artifact Registry]
    MON[Monitoring + Budgets]
  end

  SF -->|Store API via api.tharam.in| CF
  BE --> SQL
  JOB --> SQL
  BE --> RD[(Upstash Redis)]
  BE --> R2
  BE --> SM
  BE --> RZ[Razorpay]
  RZ -->|payment webhook| CF
  BE --> MSG[MSG91 OTP SMS]
  BE --> WA[WhatsApp Cloud API]
  BE --> SR[Shiprocket]
  BE --> EM[Resend / SES email]
  BE -->|revalidate webhook| SF
```

### Hostnames

| Host | Goes to | Notes |
|---|---|---|
| `tharam.in`, `www.tharam.in` | storefront | Catalog HTML cached at edge |
| `api.tharam.in` | backend | Store API only (`/store/*`, `/auth/customer/*`, `/hooks/*`). `/admin`, `/app`, `/auth/user` **blocked** by WAF |
| `admin.tharam.in` | backend | Medusa Admin at `/app`, protected by Cloudflare Access |
| `media.tharam.in` | R2 bucket | Product images, never touches GCP |

---

## 3. Request flows

**Browsing (90% of traffic)**
Customer → Cloudflare edge. Home, `/shop/*`, `/products/*` are cached HTML (Next.js ISR sets `s-maxage`), `/_next/static` and optimised images cached for 30 days. Origin is hit only on cache miss or revalidation.

**Product updated in admin**
Medusa subscriber on `product.updated` / `inventory-level.updated` → `POST storefront/api/revalidate` (shared secret) → `revalidateTag('products')` → Cloudflare cache purge for that product URL via API. Customers see the new price/stock within seconds.

**Login**
Phone number → `POST /auth/customer/otp` (custom Medusa auth provider) → MSG91 sends OTP → verify → Medusa issues customer JWT/session. Rate-limited at Cloudflare (5 req / 10 s per IP).

**Checkout & payment**
1. Cart lives in Medusa (cart ID in an httpOnly cookie).
2. Storefront creates a payment session → backend creates a Razorpay order.
3. Razorpay Checkout opens on the page (UPI intent / card / netbanking).
4. Razorpay webhook `payment.captured` → `api.tharam.in/hooks/payment/razorpay` → Medusa completes the cart → order created, **inventory reserved atomically**.
5. Subscribers fire: WhatsApp + email confirmation, low-stock check, Shiprocket order creation.
6. COD: Medusa's system/manual payment provider; order is created directly, payment captured on delivery.

**Admin**
Staff → `admin.tharam.in/app` → Cloudflare Access (email OTP, allow-list) → Medusa admin login → Admin API on the same origin.

---

## 4. Customer panel (storefront)

Matches the canvas design you already have.

| Page | Route | Rendering | Cached at edge |
|---|---|---|---|
| Home | `/` | ISR (revalidate 10 min + on-demand) | Yes |
| Catalog | `/shop/[category]` | ISR, filters via query params | Yes |
| Product | `/products/[handle]` | ISR + on-demand revalidation | Yes |
| Bag drawer / Cart | `/cart` | Client + server actions | No |
| Checkout | `/checkout` | Dynamic, server actions | No |
| Order confirmed | `/order/[id]/confirmed` | Dynamic | No |
| Account (orders, wishlist, addresses) | `/account/*` | Dynamic, auth required | No |
| Login | `/login` | Static shell + OTP calls | Yes (shell) |
| Search | `/search` | Dynamic (Postgres search at launch) | No |
| Size guide, Our story, Policies | `/pages/*` | Static | Yes |

**Rules that keep cached pages safe:** cached pages render **no personalised data on the server**. Bag count, wishlist hearts and "Hi, Vamsi" are fetched client-side after load. That's what allows HTML caching on Cloudflare's free plan (which can't bypass cache by cookie).

**Features:** OTP login + guest checkout, wishlist, pincode serviceability check (Shiprocket), size guide, reviews, coupon codes, UPI/cards/netbanking/COD, order tracking, return/exchange requests, GST invoice download, WhatsApp updates.

---

## 5. Admin panel

### Out of the box (Medusa Admin)

- Products, variants (colour × size SKUs), images, categories, collections
- **Prices**: per-variant prices in INR, **price lists** for sales (scheduled start/end), customer-group pricing
- **Inventory**: stock per SKU per location, reservations on order, adjustments
- **Orders**: fulfilment, cancellations, **returns, exchanges, claims**, refunds
- Customers & customer groups
- **Promotions**: coupon codes, % / fixed discounts, buy-X-get-Y, usage limits
- Sales channels, regions (India / INR), tax regions
- Admin users, invites, API keys (publishable key for storefront)

### Custom extensions you build (Medusa admin widgets / routes)

| Extension | Type | Purpose |
|---|---|---|
| Fabric & quality fields | Product widget + metadata | Fabric, GSM, weave, mill, care, model size — shown on product page |
| Cost breakdown | Product widget | Fabric / making / shipping / margin → "where your money goes" section |
| Low-stock board | Admin route + subscriber | List SKUs below threshold; WhatsApp/email alert |
| Shiprocket panel | Order widget | Create shipment, print label, tracking status |
| GST invoice | Order widget + workflow | PDF with CGST+SGST (intra-state, Tamil Nadu) or IGST (inter-state) |
| Reviews moderation | Admin route + custom module | Approve / hide reviews |
| Daily summary | Dashboard widget | Orders, revenue, COD vs prepaid, RTO rate |

### Access control

- Layer 1: **Cloudflare Access** allow-list of staff emails (free up to 50 users). Nobody else even sees the login page.
- Layer 2: Medusa admin user login.
- Note: Medusa open-source admin users have broad access; granular staff roles (e.g. "support can't edit prices") need custom middleware. Verify current Medusa features before relying on built-in roles.

---

## 6. Backend modules to build (Medusa v2)

| Module | Medusa extension point | Notes |
|---|---|---|
| Phone OTP login | Custom **auth provider** (`/auth/customer/otp`) | MSG91 OTP API; DLT-registered template required |
| Razorpay | Custom **payment module provider** | Order create, verify signature, webhook capture, refunds. Community plugins exist; review before use |
| COD | Built-in system/manual provider | Optional COD fee as a shipping-option surcharge |
| Shiprocket | Custom **fulfillment provider** | Rates, pincode serviceability, create shipment, tracking webhook |
| WhatsApp | Custom **notification provider** | Meta WhatsApp Cloud API utility templates |
| Email | Notification provider (Resend or SES) | Order confirmation, shipping, refund |
| File storage | Built-in **S3 file provider** → R2 | `S3_ENDPOINT=https://<account>.r2.cloudflarestorage.com` |
| GST tax | Custom **tax provider** | Apparel GST depends on the unit price slab — confirm current slabs with your CA |
| Wishlist, Reviews | Custom **modules** + store routes | Linked to customer & product via module links |
| Revalidation | Subscriber | Calls storefront revalidate API + Cloudflare purge |

---

## 7. Data model

Medusa's modules already provide (simplified):

```
customer ─┬─ address
          └─ (link) wishlist_item ── product_variant
product ── product_variant ── (link) price_set ── price (INR, price lists)
product_variant ── (link) inventory_item ── inventory_level (per stock location)
                                         └─ reservation_item (held for orders)
cart ── line_item ── payment_collection ── payment_session (Razorpay)
order ── order_line_item (price snapshot) ── fulfillment ── return / exchange
promotion ── campaign
```

Custom tables (your modules): `wishlist_item`, `review`, `otp_attempt` (audit/abuse), `invoice` (number sequence per FY).

Key behaviours you get for free: **line items snapshot the price at purchase**, inventory is **reserved on order placement** and released on cancel, returns can restock.

---

## 8. "Smooth" playbook (performance)

| Target (4G phone) | How |
|---|---|
| LCP < 2.0 s on catalog/product | ISR + Cloudflare HTML cache, hero image `priority`, AVIF/WebP |
| No cold starts at checkout | `min_instances = 1` on storefront and backend, `startup_cpu_boost` |
| TTFB < 200 ms on cached pages | Cloudflare edge (Chennai/Mumbai PoPs) |
| Images | Upload ≥1600 px originals to R2; `next/image` sizes + Cloudflare caches optimised variants 30 days |
| JS budget | < 150 KB initial JS; Server Components by default; Razorpay script loaded only on checkout |
| Consistent ISR across instances | Use a **shared Redis cache handler** for Next.js (`cacheHandler` in `next.config.js`) so all Cloud Run instances share the same cache |
| DB connections | `db-f1-micro` allows ~25 connections: backend `max_instances × pool size ≤ 20` (e.g. 3 × 6) |
| Fonts | Self-host via `next/font`, `display: swap` |
| Monitoring | Uptime checks + alert on failure; Sentry for frontend/backend errors |

---

## 9. Security

- Cloud Run ingress = **internal + load balancer only** → `*.run.app` URLs are dead from the internet.
- Cloud Armor allows **Cloudflare IP ranges only** → the LB can't be hit directly.
- Cloudflare SSL **Full (strict)** with a Cloudflare **Origin CA** certificate on the LB.
- WAF blocks `/admin`, `/app`, `/auth/user` on `api.` host; rate-limits OTP/login.
- Secrets only in **Secret Manager**; third-party keys are added with `gcloud`, never in Terraform state. Generated secrets (DB password, JWT/cookie secrets) *are* in state → state bucket is private, versioned, uniform access.
- CI uses **Workload Identity Federation** — no service-account JSON keys.
- Razorpay webhook signature verification; never trust client-side payment success.
- Cloud SQL: no authorised networks, encrypted connections only, PITR 7 days, 14 daily backups.
- Never store card data (Razorpay hosted checkout keeps you out of PCI scope).

---

## 10. Environments

| | staging | prod |
|---|---|---|
| GCP project | `tharam-staging` | `tharam-prod` |
| Edge (LB, Armor, Cloudflare host routing) | off — uses `*.run.app` URLs | on |
| Database | Neon / Supabase free tier (`use_cloudsql = false`) | Cloud SQL `db-f1-micro` |
| Min instances | 0 | 1 |
| Razorpay | test keys | live keys |
| Deploys | every merge to `main` | manual approval (GitHub Environment) |

---

## 11. Repository layout

```
tharam/
├── apps/
│   ├── storefront/              # Next.js customer panel
│   │   ├── Dockerfile
│   │   └── app/ ...
│   └── backend/                 # Medusa v2 + admin extensions
│       ├── Dockerfile
│       ├── medusa-config.ts
│       └── src/
│           ├── modules/         # razorpay, otp-auth, shiprocket, whatsapp, gst-tax, wishlist, reviews
│           ├── subscribers/     # order-placed, low-stock, revalidate
│           ├── workflows/       # invoice, returns
│           ├── api/             # custom store/admin routes
│           └── admin/           # widgets + routes (React)
├── infra/
│   ├── bootstrap/               # run once per project: state bucket, WIF, CI SAs
│   ├── modules/
│   │   ├── project-services/
│   │   ├── artifact-registry/
│   │   ├── cloudsql/
│   │   ├── secrets/
│   │   ├── cloud-run-service/
│   │   ├── load-balancer/
│   │   ├── cloudflare-edge/
│   │   ├── monitoring/
│   │   └── budget/
│   └── envs/
│       ├── staging/
│       └── prod/
└── .github/workflows/
    ├── terraform.yml
    └── deploy-apps.yml
```

---

## 12. Terraform

Provider versions pinned: `google ~> 6.0`, `cloudflare ~> 4.52` (v5 renamed many resources — stay on v4 until you deliberately migrate), `upstash ~> 1.5`. Run `terraform validate` after copying; adjust any attribute your provider version flags.

### 12.1 Bootstrap (run once per GCP project, locally)

`infra/bootstrap/main.tf`

```hcl
terraform {
  required_version = ">= 1.6"
  required_providers {
    google = { source = "hashicorp/google", version = "~> 6.0" }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

variable "project_id" { type = string }
variable "region" {
  type    = string
  default = "asia-south1"
}
variable "github_repo" {
  type        = string
  description = "owner/repo, e.g. vamsi/tharam"
}

locals {
  apis = [
    "iam.googleapis.com",
    "iamcredentials.googleapis.com",
    "sts.googleapis.com",
    "storage.googleapis.com",
    "cloudresourcemanager.googleapis.com",
    "serviceusage.googleapis.com",
  ]
}

resource "google_project_service" "apis" {
  for_each           = toset(local.apis)
  service            = each.value
  disable_on_destroy = false
}

resource "google_storage_bucket" "tfstate" {
  name                        = "${var.project_id}-tfstate"
  location                    = var.region
  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"
  force_destroy               = false
  versioning { enabled = true }
  lifecycle_rule {
    condition { num_newer_versions = 20 }
    action { type = "Delete" }
  }
}

resource "google_iam_workload_identity_pool" "github" {
  workload_identity_pool_id = "github"
  display_name              = "GitHub Actions"
  depends_on                = [google_project_service.apis]
}

resource "google_iam_workload_identity_pool_provider" "github" {
  workload_identity_pool_id          = google_iam_workload_identity_pool.github.workload_identity_pool_id
  workload_identity_pool_provider_id = "github-oidc"
  display_name                       = "GitHub OIDC"
  attribute_mapping = {
    "google.subject"       = "assertion.sub"
    "attribute.repository" = "assertion.repository"
    "attribute.ref"        = "assertion.ref"
  }
  attribute_condition = "assertion.repository == \"${var.github_repo}\""
  oidc { issuer_uri = "https://token.actions.githubusercontent.com" }
}

# Terraform runner (broad) and app deployer (narrow)
resource "google_service_account" "terraform" {
  account_id   = "ci-terraform"
  display_name = "CI Terraform"
}

resource "google_service_account" "deployer" {
  account_id   = "ci-deployer"
  display_name = "CI app deployer"
}

locals {
  terraform_roles = [
    "roles/editor",
    "roles/resourcemanager.projectIamAdmin",
    "roles/secretmanager.admin",
    "roles/run.admin",
    "roles/compute.securityAdmin",
    "roles/iam.serviceAccountAdmin",
    "roles/serviceusage.serviceUsageAdmin",
  ]
  deployer_roles = [
    "roles/run.developer",
    "roles/artifactregistry.writer",
    "roles/iam.serviceAccountUser",
  ]
}

resource "google_project_iam_member" "terraform" {
  for_each = toset(local.terraform_roles)
  project  = var.project_id
  role     = each.value
  member   = "serviceAccount:${google_service_account.terraform.email}"
}

resource "google_project_iam_member" "deployer" {
  for_each = toset(local.deployer_roles)
  project  = var.project_id
  role     = each.value
  member   = "serviceAccount:${google_service_account.deployer.email}"
}

resource "google_storage_bucket_iam_member" "tf_state" {
  bucket = google_storage_bucket.tfstate.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.terraform.email}"
}

resource "google_service_account_iam_member" "wif" {
  for_each           = { terraform = google_service_account.terraform.name, deployer = google_service_account.deployer.name }
  service_account_id = each.value
  role               = "roles/iam.workloadIdentityUser"
  member             = "principalSet://iam.googleapis.com/${google_iam_workload_identity_pool.github.name}/attribute.repository/${var.github_repo}"
}

output "tfstate_bucket" { value = google_storage_bucket.tfstate.name }
output "wif_provider" { value = google_iam_workload_identity_pool_provider.github.name }
output "terraform_sa" { value = google_service_account.terraform.email }
output "deployer_sa" { value = google_service_account.deployer.email }
```

> Budgets need `roles/billing.costsAdmin` (or Billing Account Administrator) on the **billing account** for `ci-terraform` — grant that once in the console.

---

### 12.2 Module: `project-services`

`infra/modules/project-services/main.tf`

```hcl
variable "project_id" { type = string }
variable "services" { type = list(string) }

resource "google_project_service" "this" {
  for_each           = toset(var.services)
  project            = var.project_id
  service            = each.value
  disable_on_destroy = false
}

output "ids" { value = [for s in google_project_service.this : s.id] }
```

---

### 12.3 Module: `artifact-registry`

`infra/modules/artifact-registry/main.tf`

```hcl
variable "project_id" { type = string }
variable "region" { type = string }
variable "repo_id" {
  type    = string
  default = "apps"
}

resource "google_artifact_registry_repository" "this" {
  project       = var.project_id
  location      = var.region
  repository_id = var.repo_id
  format        = "DOCKER"

  cleanup_policies {
    id     = "keep-recent"
    action = "KEEP"
    most_recent_versions { keep_count = 15 }
  }
  cleanup_policies {
    id     = "delete-old"
    action = "DELETE"
    condition { older_than = "2592000s" } # 30 days
  }
}

output "path" {
  value = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.this.repository_id}"
}
```

---

### 12.4 Module: `cloudsql`

`infra/modules/cloudsql/main.tf`

```hcl
variable "project_id" { type = string }
variable "region" { type = string }
variable "name" { type = string }
variable "tier" {
  type    = string
  default = "db-f1-micro" # shared core, cheapest; not covered by SLA
}
variable "deletion_protection" {
  type    = bool
  default = true
}

resource "google_sql_database_instance" "pg" {
  project             = var.project_id
  name                = var.name
  region              = var.region
  database_version    = "POSTGRES_16"
  deletion_protection = var.deletion_protection

  settings {
    edition           = "ENTERPRISE"
    tier              = var.tier
    availability_type = "ZONAL"
    disk_type         = "PD_SSD"
    disk_size         = 10
    disk_autoresize   = true

    backup_configuration {
      enabled                        = true
      point_in_time_recovery_enabled = true
      start_time                     = "20:30" # 02:00 IST
      transaction_log_retention_days = 7
      backup_retention_settings { retained_backups = 14 }
    }

    ip_configuration {
      ipv4_enabled = true          # reached only through the Cloud SQL connector (IAM-authorised)
      ssl_mode     = "ENCRYPTED_ONLY"
      # no authorized_networks: nothing can connect directly
    }

    maintenance_window {
      day  = 7  # Sunday
      hour = 21 # 03:00 IST
    }

    insights_config { query_insights_enabled = true }
  }
}

resource "google_sql_database" "medusa" {
  project  = var.project_id
  instance = google_sql_database_instance.pg.name
  name     = "medusa"
}

resource "random_password" "db" {
  length  = 32
  special = false
}

resource "google_sql_user" "medusa" {
  project  = var.project_id
  instance = google_sql_database_instance.pg.name
  name     = "medusa"
  password = random_password.db.result
}

output "connection_name" { value = google_sql_database_instance.pg.connection_name }

output "database_url" {
  sensitive = true
  # Unix socket mounted by Cloud Run at /cloudsql/<connection_name>
  value = "postgres://${google_sql_user.medusa.name}:${random_password.db.result}@localhost/${google_sql_database.medusa.name}?host=/cloudsql/${google_sql_database_instance.pg.connection_name}"
}
```

---

### 12.5 Module: `secrets`

Generated secrets get values from Terraform; manual ones are created empty and filled with `gcloud` (keeps third-party keys out of state).

`infra/modules/secrets/main.tf`

```hcl
variable "project_id" { type = string }

variable "generated_names" {
  type        = list(string)
  description = "Secret IDs whose values Terraform supplies"
}

variable "generated_values" {
  type      = map(string)
  sensitive = true
}

variable "manual_names" {
  type        = list(string)
  description = "Secret IDs created empty; add versions with gcloud"
}

variable "accessors" {
  type        = list(string)
  description = "IAM members allowed to read every secret"
}

resource "google_secret_manager_secret" "generated" {
  for_each  = toset(var.generated_names)
  project   = var.project_id
  secret_id = each.value
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "generated" {
  for_each    = toset(var.generated_names)
  secret      = google_secret_manager_secret.generated[each.value].id
  secret_data = var.generated_values[each.value]
}

resource "google_secret_manager_secret" "manual" {
  for_each  = toset(var.manual_names)
  project   = var.project_id
  secret_id = each.value
  replication {
    auto {}
  }
}

locals {
  all_ids = merge(
    { for k, s in google_secret_manager_secret.generated : k => s.secret_id },
    { for k, s in google_secret_manager_secret.manual : k => s.secret_id },
  )
  bindings = {
    for pair in setproduct(keys(local.all_ids), var.accessors) :
    "${pair[0]}|${pair[1]}" => { secret = local.all_ids[pair[0]], member = pair[1] }
  }
}

resource "google_secret_manager_secret_iam_member" "access" {
  for_each  = local.bindings
  project   = var.project_id
  secret_id = each.value.secret
  role      = "roles/secretmanager.secretAccessor"
  member    = each.value.member
}

output "ids" { value = local.all_ids }
```

---

### 12.6 Module: `cloud-run-service`

`infra/modules/cloud-run-service/main.tf`

```hcl
variable "project_id" { type = string }
variable "region" { type = string }
variable "name" { type = string }
variable "image" { type = string }
variable "port" { type = number }
variable "service_account_email" { type = string }
variable "ingress" { type = string }
variable "cpu" {
  type    = string
  default = "1"
}
variable "memory" {
  type    = string
  default = "512Mi"
}
variable "min_instances" {
  type    = number
  default = 0
}
variable "max_instances" {
  type    = number
  default = 3
}
variable "concurrency" {
  type    = number
  default = 80
}
variable "health_path" {
  type    = string
  default = "/"
}
variable "env" {
  type    = map(string)
  default = {}
}
variable "secret_env" {
  type        = map(string)
  default     = {}
  description = "ENV_NAME => secret_id"
}
variable "cloudsql_connection" {
  type    = string
  default = ""
}
variable "public" {
  type        = bool
  default     = true
  description = "Allow unauthenticated invocations (ingress still restricts who can reach it)"
}
variable "deletion_protection" {
  type    = bool
  default = false
}

resource "google_cloud_run_v2_service" "this" {
  project             = var.project_id
  name                = var.name
  location            = var.region
  ingress             = var.ingress
  deletion_protection = var.deletion_protection

  template {
    service_account                  = var.service_account_email
    max_instance_request_concurrency = var.concurrency
    timeout                          = "60s"

    scaling {
      min_instance_count = var.min_instances
      max_instance_count = var.max_instances
    }

    dynamic "volumes" {
      for_each = var.cloudsql_connection == "" ? [] : [1]
      content {
        name = "cloudsql"
        cloud_sql_instance { instances = [var.cloudsql_connection] }
      }
    }

    containers {
      image = var.image

      ports { container_port = var.port }

      resources {
        limits            = { cpu = var.cpu, memory = var.memory }
        cpu_idle          = true # CPU throttled between requests → cheaper idle warm instances
        startup_cpu_boost = true
      }

      dynamic "env" {
        for_each = var.env
        content {
          name  = env.key
          value = env.value
        }
      }

      dynamic "env" {
        for_each = var.secret_env
        content {
          name = env.key
          value_source {
            secret_key_ref {
              secret  = env.value
              version = "latest"
            }
          }
        }
      }

      dynamic "volume_mounts" {
        for_each = var.cloudsql_connection == "" ? [] : [1]
        content {
          name       = "cloudsql"
          mount_path = "/cloudsql"
        }
      }

      startup_probe {
        http_get { path = var.health_path }
        period_seconds    = 3
        timeout_seconds   = 2
        failure_threshold = 30
      }

      liveness_probe {
        http_get { path = var.health_path }
        period_seconds = 30
      }
    }
  }

  # CI owns the image; Terraform owns everything else.
  lifecycle {
    ignore_changes = [
      template[0].containers[0].image,
      client,
      client_version,
    ]
  }
}

resource "google_cloud_run_v2_service_iam_member" "public" {
  count    = var.public ? 1 : 0
  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.this.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

output "name" { value = google_cloud_run_v2_service.this.name }
output "uri" { value = google_cloud_run_v2_service.this.uri }
```

---

### 12.7 Module: `load-balancer`

`infra/modules/load-balancer/main.tf`

```hcl
variable "project_id" { type = string }
variable "region" { type = string }
variable "name" { type = string }
variable "address" {
  type        = string
  description = "Self link / id of a reserved global IP"
}
variable "services" {
  type        = map(string)
  description = "key => Cloud Run service name, e.g. { storefront = \"tharam-prod-storefront\" }"
}
variable "host_routes" {
  type        = map(string)
  description = "hostname => service key"
}
variable "default_service" { type = string }
variable "certificate_pem" {
  type      = string
  sensitive = true
}
variable "private_key_pem" {
  type      = string
  sensitive = true
}
variable "security_policy" {
  type    = string
  default = null
}

resource "google_compute_region_network_endpoint_group" "neg" {
  for_each              = var.services
  project               = var.project_id
  region                = var.region
  name                  = "${var.name}-${each.key}-neg"
  network_endpoint_type = "SERVERLESS"
  cloud_run { service = each.value }
}

resource "google_compute_backend_service" "be" {
  for_each              = var.services
  project               = var.project_id
  name                  = "${var.name}-${each.key}-be"
  load_balancing_scheme = "EXTERNAL_MANAGED"
  security_policy       = var.security_policy

  backend {
    group = google_compute_region_network_endpoint_group.neg[each.key].id
  }

  log_config {
    enable      = true
    sample_rate = 0.1
  }
}

resource "google_compute_url_map" "this" {
  project         = var.project_id
  name            = "${var.name}-urlmap"
  default_service = google_compute_backend_service.be[var.default_service].id

  dynamic "host_rule" {
    for_each = var.host_routes
    content {
      hosts        = [host_rule.key]
      path_matcher = host_rule.value
    }
  }

  dynamic "path_matcher" {
    for_each = toset(distinct(values(var.host_routes)))
    content {
      name            = path_matcher.value
      default_service = google_compute_backend_service.be[path_matcher.value].id
    }
  }
}

resource "google_compute_ssl_certificate" "origin" {
  project     = var.project_id
  name_prefix = "${var.name}-origin-"
  certificate = var.certificate_pem
  private_key = var.private_key_pem
  lifecycle { create_before_destroy = true }
}

resource "google_compute_target_https_proxy" "this" {
  project          = var.project_id
  name             = "${var.name}-https"
  url_map          = google_compute_url_map.this.id
  ssl_certificates = [google_compute_ssl_certificate.origin.id]
}

resource "google_compute_global_forwarding_rule" "https" {
  project               = var.project_id
  name                  = "${var.name}-https"
  load_balancing_scheme = "EXTERNAL_MANAGED"
  ip_address            = var.address
  port_range            = "443"
  target                = google_compute_target_https_proxy.this.id
}
```

---

### 12.8 Module: `cloudflare-edge`

DNS, SSL, origin certificate, WAF, rate limit, cache rules, admin Access.

`infra/modules/cloudflare-edge/main.tf`

```hcl
variable "domain" { type = string }
variable "account_id" { type = string }
variable "origin_ip" { type = string }
variable "admin_emails" { type = list(string) }

data "cloudflare_zone" "this" {
  name = var.domain
}

locals {
  zone_id = data.cloudflare_zone.this.id
  proxied_hosts = {
    root  = "@"
    www   = "www"
    api   = "api"
    admin = "admin"
  }
}

# ---------- DNS ----------
resource "cloudflare_record" "origin" {
  for_each = local.proxied_hosts
  zone_id  = local.zone_id
  name     = each.value
  type     = "A"
  content  = var.origin_ip
  proxied  = true
  ttl      = 1
}

# ---------- TLS ----------
resource "cloudflare_zone_settings_override" "this" {
  zone_id = local.zone_id
  settings {
    ssl              = "strict"
    always_use_https = "on"
    min_tls_version  = "1.2"
    brotli           = "on"
    http3            = "on"
    early_hints      = "on"
  }
}

resource "tls_private_key" "origin" {
  algorithm = "RSA"
  rsa_bits  = 2048
}

resource "tls_cert_request" "origin" {
  private_key_pem = tls_private_key.origin.private_key_pem
  subject { common_name = var.domain }
  dns_names = [var.domain, "*.${var.domain}"]
}

resource "cloudflare_origin_ca_certificate" "origin" {
  csr                = tls_cert_request.origin.cert_request_pem
  hostnames          = [var.domain, "*.${var.domain}"]
  request_type       = "origin-rsa"
  requested_validity = 5475 # 15 years
}

# ---------- WAF: admin only on admin host ----------
resource "cloudflare_ruleset" "firewall" {
  zone_id = local.zone_id
  name    = "custom firewall"
  kind    = "zone"
  phase   = "http_request_firewall_custom"

  rules {
    action      = "block"
    description = "Admin surfaces only via admin host"
    enabled     = true
    expression  = "(http.host eq \"api.${var.domain}\" and (starts_with(http.request.uri.path, \"/app\") or starts_with(http.request.uri.path, \"/admin\") or starts_with(http.request.uri.path, \"/auth/user\")))"
  }
}

# ---------- Rate limit OTP / login (Free plan: 1 rule, 10 s period) ----------
resource "cloudflare_ruleset" "ratelimit" {
  zone_id = local.zone_id
  name    = "rate limits"
  kind    = "zone"
  phase   = "http_ratelimit"

  rules {
    action      = "block"
    description = "OTP and login abuse"
    enabled     = true
    expression  = "(http.host eq \"api.${var.domain}\" and starts_with(http.request.uri.path, \"/auth/customer\"))"
    ratelimit {
      characteristics     = ["cf.colo.id", "ip.src"]
      period              = 10
      requests_per_period = 5
      mitigation_timeout  = 10
    }
  }
}

# ---------- Cache rules ----------
resource "cloudflare_ruleset" "cache" {
  zone_id = local.zone_id
  name    = "cache rules"
  kind    = "zone"
  phase   = "http_request_cache_settings"

  rules {
    action      = "set_cache_settings"
    description = "Static assets and optimised images"
    enabled     = true
    expression  = "(starts_with(http.request.uri.path, \"/_next/static\") or starts_with(http.request.uri.path, \"/_next/image\"))"
    action_parameters {
      cache = true
      edge_ttl {
        mode    = "override_origin"
        default = 2592000
      }
      browser_ttl { mode = "respect_origin" }
    }
  }

  rules {
    action      = "set_cache_settings"
    description = "Catalog HTML (ISR, respects s-maxage)"
    enabled     = true
    expression  = "(http.host in {\"${var.domain}\" \"www.${var.domain}\"} and (http.request.uri.path eq \"/\" or starts_with(http.request.uri.path, \"/shop\") or starts_with(http.request.uri.path, \"/products\") or starts_with(http.request.uri.path, \"/pages\")))"
    action_parameters {
      cache = true
      edge_ttl { mode = "respect_origin" }
    }
  }

  rules {
    action      = "set_cache_settings"
    description = "Never cache API and admin"
    enabled     = true
    expression  = "(http.host eq \"api.${var.domain}\" or http.host eq \"admin.${var.domain}\")"
    action_parameters { cache = false }
  }
}

# ---------- Zero Trust Access for admin ----------
resource "cloudflare_zero_trust_access_application" "admin" {
  zone_id          = local.zone_id
  name             = "Admin panel"
  domain           = "admin.${var.domain}"
  type             = "self_hosted"
  session_duration = "12h"
}

resource "cloudflare_zero_trust_access_policy" "staff" {
  zone_id        = local.zone_id
  application_id = cloudflare_zero_trust_access_application.admin.id
  name           = "Staff only"
  precedence     = 1
  decision       = "allow"
  include {
    email = var.admin_emails
  }
}

output "origin_certificate_pem" {
  value     = cloudflare_origin_ca_certificate.origin.certificate
  sensitive = true
}

output "origin_private_key_pem" {
  value     = tls_private_key.origin.private_key_pem
  sensitive = true
}
```

---

### 12.9 Module: `monitoring`

`infra/modules/monitoring/main.tf`

```hcl
variable "project_id" { type = string }
variable "alert_email" { type = string }
variable "checks" {
  type        = map(object({ host = string, path = string }))
  description = "name => { host, path }"
}

resource "google_monitoring_notification_channel" "email" {
  project      = var.project_id
  display_name = "Owner email"
  type         = "email"
  labels       = { email_address = var.alert_email }
}

resource "google_monitoring_uptime_check_config" "this" {
  for_each     = var.checks
  project      = var.project_id
  display_name = each.key
  timeout      = "10s"
  period       = "300s"

  http_check {
    path         = each.value.path
    port         = 443
    use_ssl      = true
    validate_ssl = true
  }

  monitored_resource {
    type   = "uptime_url"
    labels = { project_id = var.project_id, host = each.value.host }
  }
}

resource "google_monitoring_alert_policy" "uptime" {
  for_each     = google_monitoring_uptime_check_config.this
  project      = var.project_id
  display_name = "DOWN: ${each.key}"
  combiner     = "OR"

  conditions {
    display_name = "Uptime check failing"
    condition_threshold {
      filter          = "metric.type=\"monitoring.googleapis.com/uptime_check/check_passed\" AND metric.label.check_id=\"${each.value.uptime_check_id}\" AND resource.type=\"uptime_url\""
      comparison      = "COMPARISON_GT"
      threshold_value = 1
      duration        = "300s"
      aggregations {
        alignment_period     = "300s"
        per_series_aligner   = "ALIGN_NEXT_OLDER"
        cross_series_reducer = "REDUCE_COUNT_FALSE"
        group_by_fields      = ["resource.label.host"]
      }
      trigger { count = 1 }
    }
  }

  notification_channels = [google_monitoring_notification_channel.email.id]
}

output "channel_id" { value = google_monitoring_notification_channel.email.id }
```

---

### 12.10 Module: `budget`

`infra/modules/budget/main.tf`

```hcl
variable "project_id" { type = string }
variable "billing_account" { type = string }
variable "monthly_budget" {
  type        = number
  description = "In the billing account's currency (INR for an Indian billing account)"
}
variable "currency" {
  type    = string
  default = "INR"
}
variable "notification_channels" { type = list(string) }

data "google_project" "this" {
  project_id = var.project_id
}

resource "google_billing_budget" "this" {
  billing_account = var.billing_account
  display_name    = "${var.project_id} monthly"

  budget_filter {
    projects = ["projects/${data.google_project.this.number}"]
  }

  amount {
    specified_amount {
      currency_code = var.currency
      units         = tostring(var.monthly_budget)
    }
  }

  dynamic "threshold_rules" {
    for_each = [0.5, 0.9, 1.0, 1.5]
    content { threshold_percent = threshold_rules.value }
  }

  all_updates_rule {
    monitoring_notification_channels = var.notification_channels
    disable_default_iam_recipients   = false
  }
}
```

---

### 12.11 Environment root: `infra/envs/prod`

`versions.tf`

```hcl
terraform {
  required_version = ">= 1.6"

  backend "gcs" {
    bucket = "tharam-prod-tfstate" # from bootstrap output
    prefix = "prod"
  }

  required_providers {
    google     = { source = "hashicorp/google", version = "~> 6.0" }
    cloudflare = { source = "cloudflare/cloudflare", version = "~> 4.52" }
    upstash    = { source = "upstash/upstash", version = "~> 1.5" }
    random     = { source = "hashicorp/random", version = "~> 3.6" }
    tls        = { source = "hashicorp/tls", version = "~> 4.0" }
  }
}

provider "google" {
  project               = var.project_id
  region                = var.region
  billing_project       = var.project_id
  user_project_override = true # needed for billing budgets API
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

provider "upstash" {
  email   = var.upstash_email
  api_key = var.upstash_api_key
}
```

`variables.tf`

```hcl
variable "project_id" { type = string }
variable "env" { type = string }
variable "brand" {
  type    = string
  default = "tharam"
}
variable "region" {
  type    = string
  default = "asia-south1"
}
variable "domain" { type = string }
variable "billing_account" { type = string }
variable "alert_email" { type = string }
variable "admin_emails" { type = list(string) }
variable "monthly_budget_inr" {
  type    = number
  default = 8000
}

# Feature switches
variable "edge_enabled" {
  type        = bool
  description = "Global LB + Cloud Armor + Cloudflare host routing. Off for staging."
}
variable "cloud_armor_enabled" {
  type    = bool
  default = true
}
variable "use_cloudsql" {
  type        = bool
  description = "false = use external_database_url (e.g. Neon free tier)"
}
variable "external_database_url" {
  type      = string
  default   = ""
  sensitive = true
}
variable "manage_redis" {
  type    = bool
  default = true
}

# Sizing
variable "storefront_min_instances" {
  type    = number
  default = 1
}
variable "storefront_max_instances" {
  type    = number
  default = 5
}
variable "backend_min_instances" {
  type    = number
  default = 1
}
variable "backend_max_instances" {
  type    = number
  default = 3 # × DB pool size must stay under Cloud SQL connection limit
}
variable "db_tier" {
  type    = string
  default = "db-f1-micro"
}

# Third-party credentials (pass via TF_VAR_* in CI, never commit)
variable "cloudflare_api_token" {
  type      = string
  sensitive = true
}
variable "cloudflare_account_id" { type = string }
variable "upstash_email" { type = string }
variable "upstash_api_key" {
  type      = string
  sensitive = true
}
```

`main.tf`

```hcl
data "google_project" "this" {
  project_id = var.project_id
}

locals {
  name = "${var.brand}-${var.env}"

  hosts = {
    root  = var.domain
    www   = "www.${var.domain}"
    api   = "api.${var.domain}"
    admin = "admin.${var.domain}"
    media = "media.${var.domain}"
  }

  ingress = var.edge_enabled ? "INGRESS_TRAFFIC_INTERNAL_LOAD_BALANCER" : "INGRESS_TRAFFIC_ALL"

  # Deterministic Cloud Run URLs (used when edge is off, e.g. staging)
  run_url = {
    storefront = "https://${local.name}-storefront-${data.google_project.this.number}.${var.region}.run.app"
    backend    = "https://${local.name}-backend-${data.google_project.this.number}.${var.region}.run.app"
  }

  store_url = var.edge_enabled ? "https://${local.hosts.www}" : local.run_url.storefront
  api_url   = var.edge_enabled ? "https://${local.hosts.api}" : local.run_url.backend
  admin_url = var.edge_enabled ? "https://${local.hosts.admin}" : local.run_url.backend

  placeholder_image = "us-docker.pkg.dev/cloudrun/container/hello" # replaced by CI on first deploy
}

# ---------------- APIs ----------------
module "services" {
  source     = "../../modules/project-services"
  project_id = var.project_id
  services = [
    "run.googleapis.com",
    "artifactregistry.googleapis.com",
    "secretmanager.googleapis.com",
    "sqladmin.googleapis.com",
    "compute.googleapis.com",
    "monitoring.googleapis.com",
    "logging.googleapis.com",
    "billingbudgets.googleapis.com",
    "cloudresourcemanager.googleapis.com",
  ]
}

module "registry" {
  source     = "../../modules/artifact-registry"
  project_id = var.project_id
  region     = var.region
  depends_on = [module.services]
}

# ---------------- Identities ----------------
resource "google_service_account" "storefront" {
  account_id   = "${local.name}-storefront"
  display_name = "Storefront runtime"
}

resource "google_service_account" "backend" {
  account_id   = "${local.name}-backend"
  display_name = "Medusa backend runtime"
}

resource "google_project_iam_member" "backend_sql" {
  project = var.project_id
  role    = "roles/cloudsql.client"
  member  = "serviceAccount:${google_service_account.backend.email}"
}

# ---------------- Data ----------------
module "db" {
  count               = var.use_cloudsql ? 1 : 0
  source              = "../../modules/cloudsql"
  project_id          = var.project_id
  region              = var.region
  name                = "${local.name}-pg"
  tier                = var.db_tier
  deletion_protection = var.env == "prod"
  depends_on          = [module.services]
}

resource "upstash_redis_database" "redis" {
  count          = var.manage_redis ? 1 : 0
  database_name  = local.name
  region         = "global"
  primary_region = "ap-south-1" # Mumbai, same city as asia-south1
  tls            = true
  eviction       = false
}

resource "cloudflare_r2_bucket" "media" {
  account_id = var.cloudflare_account_id
  name       = "${local.name}-media"
  location   = "APAC"
}

resource "random_password" "jwt" {
  length  = 64
  special = false
}

resource "random_password" "cookie" {
  length  = 64
  special = false
}

resource "random_password" "revalidate" {
  length  = 40
  special = false
}

locals {
  database_url = var.use_cloudsql ? module.db[0].database_url : var.external_database_url
  redis_url    = var.manage_redis ? "rediss://default:${upstash_redis_database.redis[0].password}@${upstash_redis_database.redis[0].endpoint}:${upstash_redis_database.redis[0].port}" : ""
}

module "secrets" {
  source     = "../../modules/secrets"
  project_id = var.project_id

  generated_names = ["database-url", "redis-url", "jwt-secret", "cookie-secret", "revalidate-secret"]
  generated_values = {
    "database-url"      = local.database_url
    "redis-url"         = local.redis_url
    "jwt-secret"        = random_password.jwt.result
    "cookie-secret"     = random_password.cookie.result
    "revalidate-secret" = random_password.revalidate.result
  }

  # Filled manually with gcloud (see runbook)
  manual_names = [
    "r2-access-key-id",
    "r2-secret-access-key",
    "razorpay-key-id",
    "razorpay-key-secret",
    "razorpay-webhook-secret",
    "msg91-auth-key",
    "resend-api-key",
    "whatsapp-token",
    "shiprocket-email",
    "shiprocket-password",
    "cloudflare-purge-token",
  ]

  accessors = [
    "serviceAccount:${google_service_account.backend.email}",
    "serviceAccount:${google_service_account.storefront.email}",
  ]

  depends_on = [module.services]
}

# ---------------- Compute ----------------
locals {
  backend_env = {
    NODE_ENV           = "production"
    MEDUSA_WORKER_MODE = "shared" # split into server + worker services when traffic grows
    MEDUSA_BACKEND_URL = local.api_url
    ADMIN_BACKEND_URL  = local.admin_url
    STORE_CORS         = var.edge_enabled ? "https://${local.hosts.root},https://${local.hosts.www}" : local.run_url.storefront
    ADMIN_CORS         = local.admin_url
    AUTH_CORS          = var.edge_enabled ? "https://${local.hosts.www},https://${local.hosts.admin}" : "${local.run_url.storefront},${local.run_url.backend}"
    STOREFRONT_URL     = local.store_url
    DB_POOL_MAX        = "6"
    S3_ENDPOINT        = "https://${var.cloudflare_account_id}.r2.cloudflarestorage.com"
    S3_BUCKET          = cloudflare_r2_bucket.media.name
    S3_REGION          = "auto"
    S3_FILE_URL        = "https://${local.hosts.media}"
  }

  backend_secrets = {
    DATABASE_URL            = module.secrets.ids["database-url"]
    REDIS_URL               = module.secrets.ids["redis-url"]
    JWT_SECRET              = module.secrets.ids["jwt-secret"]
    COOKIE_SECRET           = module.secrets.ids["cookie-secret"]
    REVALIDATE_SECRET       = module.secrets.ids["revalidate-secret"]
    S3_ACCESS_KEY_ID        = module.secrets.ids["r2-access-key-id"]
    S3_SECRET_ACCESS_KEY    = module.secrets.ids["r2-secret-access-key"]
    RAZORPAY_KEY_ID         = module.secrets.ids["razorpay-key-id"]
    RAZORPAY_KEY_SECRET     = module.secrets.ids["razorpay-key-secret"]
    RAZORPAY_WEBHOOK_SECRET = module.secrets.ids["razorpay-webhook-secret"]
    MSG91_AUTH_KEY          = module.secrets.ids["msg91-auth-key"]
    RESEND_API_KEY          = module.secrets.ids["resend-api-key"]
    WHATSAPP_TOKEN          = module.secrets.ids["whatsapp-token"]
    SHIPROCKET_EMAIL        = module.secrets.ids["shiprocket-email"]
    SHIPROCKET_PASSWORD     = module.secrets.ids["shiprocket-password"]
    CLOUDFLARE_PURGE_TOKEN  = module.secrets.ids["cloudflare-purge-token"]
  }
}

module "backend" {
  source                = "../../modules/cloud-run-service"
  project_id            = var.project_id
  region                = var.region
  name                  = "${local.name}-backend"
  image                 = local.placeholder_image
  port                  = 9000
  cpu                   = "1"
  memory                = "1Gi"
  concurrency           = 40
  min_instances         = var.backend_min_instances
  max_instances         = var.backend_max_instances
  ingress               = local.ingress
  service_account_email = google_service_account.backend.email
  cloudsql_connection   = var.use_cloudsql ? module.db[0].connection_name : ""
  health_path           = "/health"
  env                   = local.backend_env
  secret_env            = local.backend_secrets
  deletion_protection   = var.env == "prod"
  depends_on            = [module.secrets, google_project_iam_member.backend_sql]
}

module "storefront" {
  source                = "../../modules/cloud-run-service"
  project_id            = var.project_id
  region                = var.region
  name                  = "${local.name}-storefront"
  image                 = local.placeholder_image
  port                  = 3000
  cpu                   = "1"
  memory                = "512Mi"
  concurrency           = 80
  min_instances         = var.storefront_min_instances
  max_instances         = var.storefront_max_instances
  ingress               = local.ingress
  service_account_email = google_service_account.storefront.email
  health_path           = "/api/health"
  env = {
    NODE_ENV           = "production"
    MEDUSA_BACKEND_URL = local.api_url # server-side fetches
  }
  secret_env = {
    REVALIDATE_SECRET = module.secrets.ids["revalidate-secret"]
    REDIS_URL         = module.secrets.ids["redis-url"] # shared ISR cache handler
  }
  deletion_protection = var.env == "prod"
  depends_on          = [module.secrets]
}

# DB migrations (CI updates the image, then executes)
resource "google_cloud_run_v2_job" "migrate" {
  project             = var.project_id
  name                = "${local.name}-migrate"
  location            = var.region
  deletion_protection = false

  template {
    template {
      service_account = google_service_account.backend.email
      max_retries     = 1
      timeout         = "900s"

      dynamic "volumes" {
        for_each = var.use_cloudsql ? [1] : []
        content {
          name = "cloudsql"
          cloud_sql_instance { instances = [module.db[0].connection_name] }
        }
      }

      containers {
        image   = local.placeholder_image
        command = ["npx"]
        args    = ["medusa", "db:migrate"]

        dynamic "env" {
          for_each = local.backend_env
          content {
            name  = env.key
            value = env.value
          }
        }

        dynamic "env" {
          for_each = local.backend_secrets
          content {
            name = env.key
            value_source {
              secret_key_ref {
                secret  = env.value
                version = "latest"
              }
            }
          }
        }

        dynamic "volume_mounts" {
          for_each = var.use_cloudsql ? [1] : []
          content {
            name       = "cloudsql"
            mount_path = "/cloudsql"
          }
        }
      }
    }
  }

  lifecycle {
    ignore_changes = [template[0].template[0].containers[0].image, client, client_version]
  }

  depends_on = [module.secrets]
}

# ---------------- Edge (prod) ----------------
resource "google_compute_global_address" "lb" {
  count   = var.edge_enabled ? 1 : 0
  project = var.project_id
  name    = "${local.name}-lb-ip"
}

data "cloudflare_ip_ranges" "cf" {}

resource "google_compute_security_policy" "cloudflare_only" {
  count   = var.edge_enabled && var.cloud_armor_enabled ? 1 : 0
  project = var.project_id
  name    = "${local.name}-cloudflare-only"

  dynamic "rule" {
    for_each = { for i, c in chunklist(data.cloudflare_ip_ranges.cf.ipv4_cidr_blocks, 10) : i => c }
    content {
      action   = "allow"
      priority = 1000 + rule.key
      match {
        versioned_expr = "SRC_IPS_V1"
        config { src_ip_ranges = rule.value }
      }
      description = "Cloudflare IPv4 chunk ${rule.key}"
    }
  }

  rule {
    action   = "deny(403)"
    priority = 2147483647
    match {
      versioned_expr = "SRC_IPS_V1"
      config { src_ip_ranges = ["*"] }
    }
    description = "Default deny"
  }
}

module "edge" {
  count        = var.edge_enabled ? 1 : 0
  source       = "../../modules/cloudflare-edge"
  domain       = var.domain
  account_id   = var.cloudflare_account_id
  origin_ip    = google_compute_global_address.lb[0].address
  admin_emails = var.admin_emails
}

module "lb" {
  count           = var.edge_enabled ? 1 : 0
  source          = "../../modules/load-balancer"
  project_id      = var.project_id
  region          = var.region
  name            = local.name
  address         = google_compute_global_address.lb[0].id
  certificate_pem = module.edge[0].origin_certificate_pem
  private_key_pem = module.edge[0].origin_private_key_pem
  security_policy = var.cloud_armor_enabled ? google_compute_security_policy.cloudflare_only[0].id : null
  default_service = "storefront"

  services = {
    storefront = module.storefront.name
    backend    = module.backend.name
  }

  host_routes = {
    (local.hosts.root)  = "storefront"
    (local.hosts.www)   = "storefront"
    (local.hosts.api)   = "backend"
    (local.hosts.admin) = "backend"
  }
}

# ---------------- Ops ----------------
module "monitoring" {
  source      = "../../modules/monitoring"
  project_id  = var.project_id
  alert_email = var.alert_email
  checks = var.edge_enabled ? {
    storefront = { host = local.hosts.www, path = "/api/health" }
    api        = { host = local.hosts.api, path = "/health" }
  } : {}
  depends_on = [module.services]
}

module "budget" {
  source                = "../../modules/budget"
  project_id            = var.project_id
  billing_account       = var.billing_account
  monthly_budget        = var.monthly_budget_inr
  notification_channels = [module.monitoring.channel_id]
  depends_on            = [module.services]
}
```

`outputs.tf`

```hcl
output "registry" { value = module.registry.path }
output "store_url" { value = local.store_url }
output "api_url" { value = local.api_url }
output "admin_url" { value = "${local.admin_url}/app" }
output "lb_ip" { value = var.edge_enabled ? google_compute_global_address.lb[0].address : null }
output "migrate_job" { value = google_cloud_run_v2_job.migrate.name }
```

`prod.tfvars`

```hcl
project_id      = "tharam-prod"
env             = "prod"
domain          = "tharam.in"
billing_account = "XXXXXX-XXXXXX-XXXXXX"
alert_email     = "you@example.com"
admin_emails    = ["you@example.com"]

edge_enabled        = true
cloud_armor_enabled = true
use_cloudsql        = true
manage_redis        = true

storefront_min_instances = 1
backend_min_instances    = 1
monthly_budget_inr       = 8000

cloudflare_account_id = "your-cloudflare-account-id"
upstash_email         = "you@example.com"
# cloudflare_api_token and upstash_api_key come from TF_VAR_* env vars
```

### 12.12 Environment root: `infra/envs/staging`

Same `versions.tf` (change backend `bucket`/`prefix`), same `variables.tf`, `main.tf`, `outputs.tf` — symlink or copy them. Only the tfvars differ:

`staging.tfvars`

```hcl
project_id      = "tharam-staging"
env             = "staging"
domain          = "tharam.in" # unused while edge_enabled = false
billing_account = "XXXXXX-XXXXXX-XXXXXX"
alert_email     = "you@example.com"
admin_emails    = ["you@example.com"]

edge_enabled = false # use *.run.app URLs, no LB cost
use_cloudsql = false # Neon / Supabase free tier
# external_database_url via TF_VAR_external_database_url
manage_redis = true

storefront_min_instances = 0
backend_min_instances    = 0
monthly_budget_inr       = 500

cloudflare_account_id = "your-cloudflare-account-id"
upstash_email         = "you@example.com"
```

> In staging the admin panel is reachable at the backend `run.app` URL protected only by Medusa login — fine for test data; never put real customer data in staging.

---

## 13. Application containers

`apps/backend/Dockerfile`

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx medusa build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/.medusa/server ./
RUN npm install --omit=dev
EXPOSE 9000
CMD ["npx", "medusa", "start"]
```

`apps/backend/medusa-config.ts` (essentials)

```ts
import { defineConfig, loadEnv } from "@medusajs/framework/utils"

loadEnv(process.env.NODE_ENV || "development", process.cwd())

export default defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL,
    workerMode: process.env.MEDUSA_WORKER_MODE as "shared" | "worker" | "server",
    databaseDriverOptions: {
      pool: { min: 0, max: Number(process.env.DB_POOL_MAX || 6) },
    },
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET!,
      cookieSecret: process.env.COOKIE_SECRET!,
    },
  },
  admin: {
    backendUrl: process.env.ADMIN_BACKEND_URL, // admin.tharam.in — same origin as the admin UI
  },
  modules: [
    { resolve: "@medusajs/medusa/cache-redis", options: { redisUrl: process.env.REDIS_URL } },
    { resolve: "@medusajs/medusa/event-bus-redis", options: { redisUrl: process.env.REDIS_URL } },
    { resolve: "@medusajs/medusa/workflow-engine-redis", options: { redis: { url: process.env.REDIS_URL } } },
    {
      resolve: "@medusajs/medusa/file",
      options: {
        providers: [{
          resolve: "@medusajs/medusa/file-s3",
          id: "s3",
          options: {
            file_url: process.env.S3_FILE_URL,
            access_key_id: process.env.S3_ACCESS_KEY_ID,
            secret_access_key: process.env.S3_SECRET_ACCESS_KEY,
            region: process.env.S3_REGION,
            bucket: process.env.S3_BUCKET,
            endpoint: process.env.S3_ENDPOINT,
          },
        }],
      },
    },
    // + your custom modules: razorpay payment provider, otp auth provider,
    //   shiprocket fulfillment provider, whatsapp/resend notification providers, gst tax provider
  ],
})
```

> Check the option names against the Medusa version you install — module option keys occasionally change between minor releases.

`apps/storefront/Dockerfile` (Next.js `output: "standalone"`)

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# NEXT_PUBLIC_* values are baked in at build time → pass as build args per environment
ARG NEXT_PUBLIC_MEDUSA_BACKEND_URL
ARG NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_BASE_URL
ARG NEXT_PUBLIC_RAZORPAY_KEY_ID
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0 NEXT_TELEMETRY_DISABLED=1
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

Storefront notes:
- Add `app/api/health/route.ts` returning `200`.
- Add `app/api/revalidate/route.ts` checking `REVALIDATE_SECRET`, calling `revalidateTag()`.
- Product pages: `generateStaticParams` returns `[]` (or top 20) so builds don't depend on the backend; pages are generated on first request and cached.
- Configure a Redis `cacheHandler` so ISR is shared across instances.

---

## 14. CI/CD (GitHub Actions)

GitHub repo settings → **Environments**: `staging`, `prod` (required reviewer = you), `staging-plan`, `prod-plan`.
Per-environment **variables**: `GCP_PROJECT`, `WIF_PROVIDER`, `TF_SA`, `DEPLOY_SA`, `NAME` (e.g. `tharam-prod`), `API_URL`, `STORE_URL`, `MEDUSA_PUBLISHABLE_KEY`, `RAZORPAY_KEY_ID`.
Per-environment **secrets**: `CLOUDFLARE_API_TOKEN`, `UPSTASH_API_KEY`, `EXTERNAL_DATABASE_URL` (staging only).

`.github/workflows/terraform.yml`

```yaml
name: terraform

on:
  pull_request:
    paths: ["infra/**"]
  push:
    branches: [main]
    paths: ["infra/**"]

permissions:
  contents: read
  id-token: write

jobs:
  terraform:
    strategy:
      max-parallel: 1
      matrix:
        env: [staging, prod]
    runs-on: ubuntu-latest
    environment: ${{ github.event_name == 'push' && matrix.env || format('{0}-plan', matrix.env) }}
    defaults:
      run:
        working-directory: infra/envs/${{ matrix.env }}
    env:
      TF_VAR_cloudflare_api_token: ${{ secrets.CLOUDFLARE_API_TOKEN }}
      TF_VAR_upstash_api_key: ${{ secrets.UPSTASH_API_KEY }}
      TF_VAR_external_database_url: ${{ secrets.EXTERNAL_DATABASE_URL }}
    steps:
      - uses: actions/checkout@v4

      - uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: ${{ vars.WIF_PROVIDER }}
          service_account: ${{ vars.TF_SA }}

      - uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: 1.9.8

      - run: terraform fmt -check -recursive ../..
      - run: terraform init -input=false
      - run: terraform validate
      - run: terraform plan -input=false -var-file=${{ matrix.env }}.tfvars -out=tfplan

      - if: github.event_name == 'push'
        run: terraform apply -input=false tfplan
```

`.github/workflows/deploy-apps.yml`

```yaml
name: deploy-apps

on:
  push:
    branches: [main]
    paths: ["apps/**"]
  workflow_dispatch:
    inputs:
      env:
        type: choice
        options: [staging, prod]
        default: staging

permissions:
  contents: read
  id-token: write

env:
  REGION: asia-south1

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: ${{ inputs.env || 'staging' }}
    steps:
      - uses: actions/checkout@v4

      - uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: ${{ vars.WIF_PROVIDER }}
          service_account: ${{ vars.DEPLOY_SA }}

      - uses: google-github-actions/setup-gcloud@v2

      - name: Docker auth
        run: gcloud auth configure-docker ${REGION}-docker.pkg.dev --quiet

      - name: Build & push backend
        run: |
          IMG=${REGION}-docker.pkg.dev/${{ vars.GCP_PROJECT }}/apps/backend:${GITHUB_SHA}
          docker build -t "$IMG" apps/backend
          docker push "$IMG"
          echo "BACKEND_IMG=$IMG" >> "$GITHUB_ENV"

      - name: Build & push storefront
        run: |
          IMG=${REGION}-docker.pkg.dev/${{ vars.GCP_PROJECT }}/apps/storefront:${GITHUB_SHA}
          docker build -t "$IMG" \
            --build-arg NEXT_PUBLIC_MEDUSA_BACKEND_URL=${{ vars.API_URL }} \
            --build-arg NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=${{ vars.MEDUSA_PUBLISHABLE_KEY }} \
            --build-arg NEXT_PUBLIC_BASE_URL=${{ vars.STORE_URL }} \
            --build-arg NEXT_PUBLIC_RAZORPAY_KEY_ID=${{ vars.RAZORPAY_KEY_ID }} \
            apps/storefront
          docker push "$IMG"
          echo "STOREFRONT_IMG=$IMG" >> "$GITHUB_ENV"

      - name: Run database migrations
        run: |
          gcloud run jobs update ${{ vars.NAME }}-migrate --image "$BACKEND_IMG" --region "$REGION"
          gcloud run jobs execute ${{ vars.NAME }}-migrate --region "$REGION" --wait

      - name: Deploy backend
        run: gcloud run deploy ${{ vars.NAME }}-backend --image "$BACKEND_IMG" --region "$REGION"

      - name: Deploy storefront
        run: gcloud run deploy ${{ vars.NAME }}-storefront --image "$STOREFRONT_IMG" --region "$REGION"
```

Cloud Run keeps previous revisions — rollback is `gcloud run services update-traffic <svc> --to-revisions <rev>=100`.

---

## 15. Cost estimate (monthly, INR, estimates)

### Production — "smooth" mode (`min_instances = 1`, LB + Cloud Armor)

| Item | ₹ / month |
|---|---|
| Global HTTPS LB forwarding rule | ~1,600 |
| Cloud Armor (1 policy + 3 rules) | ~700 |
| Cloud Run storefront (1 warm, idle-throttled + traffic) | ~1,000–2,000 |
| Cloud Run backend (1 warm, 1 vCPU/1 GiB + traffic) | ~1,500–2,500 |
| Cloud SQL `db-f1-micro` + 10 GB SSD + backups | ~1,100–1,400 |
| Upstash Redis | 0–400 |
| Cloudflare (CDN, WAF, Access ≤50 users), R2 ≤10 GB | 0 |
| Artifact Registry, Secret Manager, Logging | ~100–300 |
| **Infra total** | **~₹6,000–9,000** |

### Production — lean mode
Set `storefront_min_instances = 0`, `backend_min_instances = 0`, `cloud_armor_enabled = false` → **~₹3,000–4,000**. First request after idle takes a few seconds (cold start), so switch to smooth mode once you're running ads.

### Per-order / per-use costs (not infra)
| Item | Cost |
|---|---|
| Razorpay (cards/UPI/netbanking) | ~2% + 18% GST ≈ 2.36% of prepaid order value |
| OTP SMS (MSG91) | ~₹0.15–0.20 per OTP |
| WhatsApp utility message | roughly ₹0.12–0.15 per message |
| Shiprocket | per-shipment, weight/zone based |
| Domain | ₹800–1,500 / year |
| DLT registration (SMS) | one-time, a few thousand ₹ |

### Staging
Scaled to zero, no LB, free DB → **₹0–300**.

---

## 16. Scaling path

| Signal | Change |
|---|---|
| Cold starts noticed / ads running | `min_instances = 1` (smooth mode) |
| DB CPU > 60% or connections maxed | `db_tier = "db-g1-small"` → then a dedicated-core tier; add PgBouncer if needed |
| Background jobs slow down checkout | Split backend: `server` service + `worker` service (`MEDUSA_WORKER_MODE`) |
| Search quality matters | Add Meilisearch (Cloud Run + volume or Meilisearch Cloud) |
| > ~₹10 lakh/month GMV | Ask Razorpay for custom pricing; Cloud SQL HA (`availability_type = "REGIONAL"`) |
| Many staff with different permissions | Custom role middleware on admin routes |
| Very high traffic | Cloud Run max instances up; Redis paid tier; consider GKE only if you need it — Cloud Run will carry you a long way |

---

## 17. First-time setup runbook

1. **Accounts**: GCP (2 projects + billing), Cloudflare (add domain, set nameservers), Upstash, Razorpay (KYC), MSG91 (+ DLT registration & OTP template), Meta WhatsApp Business, Shiprocket, Resend, GitHub repo.
2. **Bootstrap** each GCP project:
   ```bash
   cd infra/bootstrap
   terraform init && terraform apply -var project_id=tharam-prod -var github_repo=<owner>/tharam
   ```
   Put outputs into GitHub environment variables.
3. **Cloudflare**: enable Zero Trust (free plan) once in the dashboard; create an API token with Zone DNS/SSL/WAF/Cache Rules/Access edit, R2 edit, and Origin CA permissions.
4. **First apply** (locally or via PR → main): `terraform apply -var-file=prod.tfvars`. Services start with a placeholder image.
5. **Add manual secrets**:
   ```bash
   printf '%s' 'rzp_live_xxx' | gcloud secrets versions add razorpay-key-id --data-file=- --project tharam-prod
   # repeat for each manual secret
   ```
6. **R2**: create an R2 API token (object read/write on the bucket) → secrets; connect `media.tharam.in` as the bucket's custom domain in the Cloudflare dashboard.
7. **Deploy apps**: run `deploy-apps` workflow (staging first, then prod).
8. **Medusa setup**: `gcloud run jobs execute` a one-off with `npx medusa user -e you@example.com -p <pwd>` to create the first admin; log in at `admin.tharam.in/app`; create the India region (INR), tax regions, stock location, shipping options, sales channel; create a **publishable API key** → put it in `MEDUSA_PUBLISHABLE_KEY` and redeploy the storefront.
9. **Razorpay webhook**: point to `https://api.tharam.in/hooks/payment/razorpay_razorpay` (exact path depends on your provider ID) with the webhook secret.
10. **Smoke test**: browse → OTP login → add to bag → UPI test payment → order in admin → stock decreased → WhatsApp/email received → return flow.

---

## 18. Launch checklist

- [ ] GST registration, invoice series, CA confirms GST slab logic
- [ ] Policies: shipping, returns/exchanges, privacy, terms (linked in footer + checkout)
- [ ] MRP + selling price on every variant
- [ ] Real product photos (WebP), size charts filled, fabric details filled
- [ ] Razorpay live mode, webhook verified, refund tested
- [ ] COD limits (max order value, pincode allow-list) and COD fee decided
- [ ] DLT-approved OTP & transactional SMS templates
- [ ] WhatsApp templates approved (order placed, shipped, delivered)
- [ ] Uptime alerts arriving at your email; budget alerts tested
- [ ] Cloud SQL backup restore tested once
- [ ] Lighthouse mobile ≥ 90 on home, catalog, product
- [ ] Admin reachable only via `admin.` host behind Access; `api.tharam.in/app` returns 403
