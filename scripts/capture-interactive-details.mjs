import { chromium } from "playwright";
import { writeFileSync } from "node:fs";
import { join } from "node:path";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const LOCAL_DIR = "/Users/saiedsagar/DEVELOPER/DEVELOPER/MYGD/screenshots";
const ARTIFACT_DIR = "/Users/saiedsagar/.gemini/antigravity/brain/707fba74-a606-4ffd-8857-65a2f09ff3d3/screenshots";

async function main() {
  const browser = await chromium.launch({
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    headless: true,
  });

  const record = async (page, filename, options = {}) => {
    await page.waitForTimeout(options.settleMs ?? 600);
    const buf = await page.screenshot({ fullPage: options.fullPage ?? false, ...options });
    writeFileSync(join(LOCAL_DIR, filename), buf);
    writeFileSync(join(ARTIFACT_DIR, filename), buf);
    console.log(`  📸 Saved: ${filename}`);
  };

  try {
    // 1. Homepage Item Customization Modal
    {
      const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
      const page = await context.newPage();
      await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });

      // Click on any product button inside MenuSection
      const productButton = page.locator("main section button:has-text('€')").first();
      if (await productButton.count() > 0) {
        await productButton.click();
        await page.waitForTimeout(800);
        await record(page, "03_homepage_item_customization_modal.png");
      }
      await context.close();
    }

    // 2. Pre-order Cart Drawer and Placed Order confirmation
    {
      const context = await browser.newContext({ viewport: { width: 1200, height: 850 }, deviceScaleFactor: 2 });
      const page = await context.newPage();
      await page.goto(`${BASE_URL}/order`, { waitUntil: "networkidle" });

      // Switch to COUNTER_PICKUP or enter vehicle
      const counterPickup = page.locator("button:has-text('Counter pickup'), [role='radio']:has-text('Counter')").first();
      if (await counterPickup.count() > 0) {
        await counterPickup.click();
      }

      // Click Add on first item
      const addBtn1 = page.locator("button:has-text('Add')").first();
      if (await addBtn1.count() > 0) {
        await addBtn1.click();
        await page.waitForTimeout(400);
        // If upgrade modal opens, click "Make it a menu"
        const upgradeBtn = page.locator("button:has-text('Make it a menu'), button:has-text('Just the')").first();
        if (await upgradeBtn.count() > 0) await upgradeBtn.click();
      }

      // Click Add on second item
      const addBtn2 = page.locator("button:has-text('Add')").nth(1);
      if (await addBtn2.count() > 0) {
        await addBtn2.click();
        await page.waitForTimeout(400);
        const upgradeBtn = page.locator("button:has-text('Just the'), button:has-text('Make it a menu')").first();
        if (await upgradeBtn.count() > 0) await upgradeBtn.click();
      }

      // Click View order
      const viewOrderBtn = page.locator("button:has-text('View order')").first();
      if (await viewOrderBtn.count() > 0) {
        await viewOrderBtn.click();
        await page.waitForTimeout(600);
        await record(page, "08_online_order_cart_drawer.png");

        // Click Place pre-order
        const placeBtn = page.locator("button:has-text('Place pre-order')").first();
        if (await placeBtn.count() > 0) {
          await placeBtn.click();
          await page.waitForTimeout(800);
          await record(page, "09_online_order_placed_confirmation.png");
        }
      }
      await context.close();
    }

    console.log("✨ Interactive details captured successfully!");
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
