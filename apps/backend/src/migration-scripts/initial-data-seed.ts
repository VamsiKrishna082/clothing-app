import { MedusaContainer } from "@medusajs/framework";
import {
  ContainerRegistrationKeys,
  ModuleRegistrationName,
  Modules,
} from "@medusajs/framework/utils";
import {
  createApiKeysWorkflow,
  createRegionsWorkflow,
  createSalesChannelsWorkflow,
  createShippingOptionsWorkflow,
  createStockLocationsWorkflow,
  createStoresWorkflow,
  createTaxRegionsWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
} from "@medusajs/medusa/core-flows";

/**
 * Store setup for Tharam — runs once with `medusa db:migrate`.
 * India only: INR, prices include GST, COD via the system payment provider,
 * one warehouse in Tiruppur. The catalogue is seeded separately
 * (`npm run seed` → src/scripts/seed-catalog.ts) so production starts empty.
 */
export const FREE_SHIPPING_ABOVE = 999;

export default async function initial_data_seed({
  container,
}: {
  container: MedusaContainer;
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const link = container.resolve(ContainerRegistrationKeys.LINK);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const fulfillmentModuleService = container.resolve(
    ModuleRegistrationName.FULFILLMENT
  );

  logger.info("Seeding Tharam store setup...");
  const {
    result: [webStore],
  } = await createSalesChannelsWorkflow(container).run({
    input: {
      salesChannelsData: [
        { name: "Tharam Web Store", description: "tharam.in storefront" },
      ],
    },
  });

  const {
    result: [publishableApiKey],
  } = await createApiKeysWorkflow(container).run({
    input: {
      api_keys: [
        { title: "Storefront", type: "publishable", created_by: "" },
      ],
    },
  });

  await linkSalesChannelsToApiKeyWorkflow(container).run({
    input: { id: publishableApiKey.id, add: [webStore.id] },
  });

  await createStoresWorkflow(container).run({
    input: {
      stores: [
        {
          name: "Tharam",
          // Tax-inclusive at both currency and region level, or GST gets added on top of MRP.
          supported_currencies: [{ currency_code: "inr", is_default: true, is_tax_inclusive: true }],
          default_sales_channel_id: webStore.id,
        },
      ],
    },
  });

  const {
    result: [region],
  } = await createRegionsWorkflow(container).run({
    input: {
      regions: [
        {
          name: "India",
          currency_code: "inr",
          countries: ["in"],
          // pp_system_default = Cash on Delivery until Razorpay is added.
          payment_providers: ["pp_system_default"],
          automatic_taxes: true,
          // Indian MRP is GST-inclusive: the price on the tag is the price paid.
          is_tax_inclusive: true,
        },
      ],
    },
  });

  // Apparel: 5% GST up to ₹2,500 per piece. Confirm slabs with your CA; the
  // custom GST provider (CGST+SGST vs IGST) replaces this later.
  await createTaxRegionsWorkflow(container).run({
    input: [
      {
        country_code: "in",
        provider_id: "tp_system",
        default_tax_rate: { name: "GST", code: "GST5", rate: 5 },
      },
    ],
  });

  const {
    result: [warehouse],
  } = await createStockLocationsWorkflow(container).run({
    input: {
      locations: [
        {
          name: "Tiruppur Warehouse",
          address: {
            address_1: "Textile Market Road",
            city: "Tiruppur",
            province: "Tamil Nadu",
            postal_code: "641601",
            country_code: "IN",
          },
        },
      ],
    },
  });

  await link.create({
    [Modules.STOCK_LOCATION]: { stock_location_id: warehouse.id },
    [Modules.FULFILLMENT]: { fulfillment_provider_id: "manual_manual" },
  });

  // Created by a core migration.
  const { data: shippingProfiles } = await query.graph({
    entity: "shipping_profile",
    fields: ["id"],
  });
  const shippingProfile = shippingProfiles[0];

  const fulfillmentSet = await fulfillmentModuleService.createFulfillmentSets({
    name: "Tiruppur Warehouse delivery",
    type: "shipping",
    service_zones: [
      { name: "India", geo_zones: [{ country_code: "in", type: "country" }] },
    ],
  });

  await link.create({
    [Modules.STOCK_LOCATION]: { stock_location_id: warehouse.id },
    [Modules.FULFILLMENT]: { fulfillment_set_id: fulfillmentSet.id },
  });

  const storeRules = [
    { attribute: "enabled_in_store", value: "true", operator: "eq" as const },
    { attribute: "is_return", value: "false", operator: "eq" as const },
  ];
  const freeAbove = [
    { attribute: "item_total", operator: "gte" as const, value: FREE_SHIPPING_ABOVE },
  ];

  await createShippingOptionsWorkflow(container).run({
    input: [
      {
        name: "Standard Delivery",
        price_type: "flat",
        provider_id: "manual_manual",
        service_zone_id: fulfillmentSet.service_zones[0].id,
        shipping_profile_id: shippingProfile.id,
        type: {
          label: "Standard",
          description: `3–6 days. Free above ₹${FREE_SHIPPING_ABOVE}.`,
          code: "standard",
        },
        prices: [
          { currency_code: "inr", amount: 79 },
          { region_id: region.id, amount: 79 },
          { currency_code: "inr", amount: 0, rules: freeAbove },
          { region_id: region.id, amount: 0, rules: freeAbove },
        ],
        rules: storeRules,
      },
      {
        name: "Express Delivery",
        price_type: "flat",
        provider_id: "manual_manual",
        service_zone_id: fulfillmentSet.service_zones[0].id,
        shipping_profile_id: shippingProfile.id,
        type: {
          label: "Express",
          description: "1–2 days in metro cities.",
          code: "express",
        },
        prices: [
          { currency_code: "inr", amount: 149 },
          { region_id: region.id, amount: 149 },
        ],
        rules: storeRules,
      },
    ],
  });

  await linkSalesChannelsToStockLocationWorkflow(container).run({
    input: { id: warehouse.id, add: [webStore.id] },
  });

  logger.info("Finished Tharam store setup (India / INR / COD).");
}
