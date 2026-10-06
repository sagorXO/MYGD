// Test suite for Asset Ingestion Pipeline & Fallback Engine (menu-assets.ts)

import test from "node:test";
import assert from "node:assert/strict";
import {
  getMenuAsset,
  getBrandAsset,
  generateVectorPlaceholder,
  MENU_ASSET_REGISTRY,
} from "../src/lib/menu-assets.ts";

test("Asset Registry - Contains canonical products with valid categories", () => {
  assert.ok(MENU_ASSET_REGISTRY["MYGD-DB-HAMBURG"]);
  assert.equal(MENU_ASSET_REGISTRY["MYGD-DB-HAMBURG"].category, "doener-burgers");
  assert.ok(MENU_ASSET_REGISTRY["MYGD-BOWL-BEEF"]);
  assert.equal(MENU_ASSET_REGISTRY["MYGD-BOWL-BEEF"].category, "bowls");
});

test("Menu Asset Lookup - Resolves exact SKU or falls back to remote image", () => {
  const asset = getMenuAsset("MYGD-DB-HAMBURG");
  assert.ok(asset.startsWith("http") || asset.startsWith("/assets/"));
});

test("Menu Asset Lookup - Clean fallback to vector placeholder on unknown SKU", () => {
  const asset = getMenuAsset("UNKNOWN-PRODUCT-999", "SPECIAL");
  assert.ok(asset.startsWith("data:image/svg+xml"), "Should generate valid SVG data URI");
  assert.ok(asset.includes("UNKNOWN-PRODUCT-999"), "Should include item name in placeholder");
});

test("Vector Placeholder Generator - Produces valid SVG data URI with branding", () => {
  const uri = generateVectorPlaceholder("Beef Wrap", "WRAPS");
  assert.ok(uri.startsWith("data:image/svg+xml;utf8,"));
  assert.ok(uri.includes("MYGD"));
  assert.ok(uri.includes("Beef%20Wrap") || uri.includes("Beef Wrap"));
});

test("Brand Asset Lookup - Resolves primary logo", () => {
  const logo = getBrandAsset("LOGO_PRIMARY");
  assert.equal(logo, "/assets/brand/logo.svg");
});
