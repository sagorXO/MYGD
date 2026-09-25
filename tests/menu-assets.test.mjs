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
  assert.ok(MENU_ASSET_REGISTRY["MYGD-CL-DONER"]);
  assert.equal(MENU_ASSET_REGISTRY["MYGD-CL-DONER"].category, "DOENER");
  assert.ok(MENU_ASSET_REGISTRY["MYGD-DN-BOX"]);
  assert.equal(MENU_ASSET_REGISTRY["MYGD-DN-BOX"].category, "BOWLS");
});

test("Menu Asset Lookup - Resolves exact SKU or falls back to remote image", () => {
  const asset = getMenuAsset("MYGD-CL-DONER");
  assert.ok(asset.startsWith("http") || asset.startsWith("/assets/"));
});

test("Menu Asset Lookup - Clean fallback to vector placeholder on unknown SKU", () => {
  const asset = getMenuAsset("UNKNOWN-PRODUCT-999", "SPECIAL");
  assert.ok(asset.startsWith("data:image/svg+xml"), "Should generate valid SVG data URI");
  assert.ok(asset.includes("UNKNOWN-PRODUCT-999"), "Should include item name in placeholder");
});

test("Vector Placeholder Generator - Produces valid SVG data URI with branding", () => {
  const uri = generateVectorPlaceholder("Steak Döner", "DOENER");
  assert.ok(uri.startsWith("data:image/svg+xml;utf8,"));
  assert.ok(uri.includes("MYGD"));
  assert.ok(uri.includes("Steak%20D%C3%B6ner") || uri.includes("Steak Döner"));
});

test("Brand Asset Lookup - Resolves primary logo", () => {
  const logo = getBrandAsset("LOGO_PRIMARY");
  assert.equal(logo, "/assets/brand/logo.svg");
});
