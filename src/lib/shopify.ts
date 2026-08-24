// MY GERMAN DÖNER — Shopify API & Webhook Integration Client
// Manages single-source-of-truth syncing between Shopify Cloud and Custom Modules

import crypto from "crypto";

export interface ShopifyConfig {
  shopDomain: string;
  accessToken: string;
  apiVersion: string;
  webhookSecret: string;
}

export const shopifyConfig: ShopifyConfig = {
  shopDomain: process.env.SHOPIFY_SHOP_DOMAIN || "my-german-doner.myshopify.com",
  accessToken: process.env.SHOPIFY_ADMIN_ACCESS_TOKEN || "",
  apiVersion: process.env.SHOPIFY_API_VERSION || "2024-10",
  webhookSecret: process.env.SHOPIFY_WEBHOOK_SECRET || "",
};

/**
 * Executes a typed GraphQL Query or Mutation against the Shopify Admin API
 */
export async function shopifyGraphQL<T = any>(
  query: string,
  variables: Record<string, any> = {}
): Promise<{ data?: T; errors?: any[] }> {
  const endpoint = `https://${shopifyConfig.shopDomain}/admin/api/${shopifyConfig.apiVersion}/graphql.json`;

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": shopifyConfig.accessToken,
      },
      body: JSON.stringify({ query, variables }),
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`[Shopify API Error] ${res.status}:`, errorText);
      return { errors: [{ message: `HTTP ${res.status}: ${errorText}` }] };
    }

    const json = await res.json();
    return json;
  } catch (err: any) {
    console.error("[Shopify Network Error]", err);
    return { errors: [{ message: err.message || "Network request failed" }] };
  }
}

/**
 * Validates the HMAC signature on inbound Shopify Webhook payloads
 */
export function verifyShopifyWebhook(
  rawBody: string,
  hmacHeader: string | null
): boolean {
  if (!hmacHeader || !shopifyConfig.webhookSecret) {
    // In local dev without secret configured, log warning
    if (process.env.NODE_ENV === "development") return true;
    return false;
  }

  const generatedHash = crypto
    .createHmac("sha256", shopifyConfig.webhookSecret)
    .update(rawBody, "utf8")
    .digest("base64");

  return crypto.timingSafeEqual(
    Buffer.from(generatedHash),
    Buffer.from(hmacHeader)
  );
}

/**
 * Fetches all products and variants from Shopify Admin API
 */
export async function getShopifyProducts() {
  const query = `
    query GetProducts($first: Int!) {
      products(first: $first) {
        edges {
          node {
            id
            title
            handle
            description
            productType
            tags
            images(first: 5) {
              edges {
                node {
                  url
                  altText
                }
              }
            }
            variants(first: 20) {
              edges {
                node {
                  id
                  title
                  sku
                  price
                  inventoryQuantity
                  inventoryItem {
                    id
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  return shopifyGraphQL(query, { first: 50 });
}

/**
 * Fetches multi-location inventory levels
 */
export async function getShopifyLocations() {
  const query = `
    query GetLocations {
      locations(first: 10) {
        edges {
          node {
            id
            name
            address {
              city
              country
            }
            isActive
          }
        }
      }
    }
  `;

  return shopifyGraphQL(query);
}
