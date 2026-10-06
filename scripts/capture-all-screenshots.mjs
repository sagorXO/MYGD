import { chromium } from "playwright";
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const LOCAL_DIR = "/Users/saiedsagar/DEVELOPER/DEVELOPER/MYGD/screenshots";
const ARTIFACT_DIR = "/Users/saiedsagar/.gemini/antigravity/brain/707fba74-a606-4ffd-8857-65a2f09ff3d3/screenshots";

mkdirSync(LOCAL_DIR, { recursive: true });
mkdirSync(ARTIFACT_DIR, { recursive: true });

function saveScreenshot(filename, buffer) {
  const localPath = join(LOCAL_DIR, filename);
  const artifactPath = join(ARTIFACT_DIR, filename);
  import("node:fs").then(fs => {
    fs.writeFileSync(localPath, buffer);
    fs.writeFileSync(artifactPath, buffer);
  });
}

async function main() {
  console.log("🚀 Starting comprehensive screenshot capture for MYGD...");
  const browser = await chromium.launch({
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    headless: true,
  });

  try {
    // -------------------------------------------------------------
    // Helper to save buffer to both destinations
    // -------------------------------------------------------------
    const record = async (page, filename, options = {}) => {
      // Small pause to allow animations / fonts / re-renders to settle
      await page.waitForTimeout(options.settleMs ?? 600);
      const buf = await page.screenshot({ fullPage: options.fullPage ?? false, ...options });
      const localPath = join(LOCAL_DIR, filename);
      const artifactPath = join(ARTIFACT_DIR, filename);
      const fs = await import("node:fs");
      fs.writeFileSync(localPath, buf);
      fs.writeFileSync(artifactPath, buf);
      console.log(`  📸 Saved: ${filename}`);
    };

    // -------------------------------------------------------------
    // 1. PUBLIC WEBSITE & HOMEPAGE (Desktop & Mobile & Modal)
    // -------------------------------------------------------------
    console.log("\n--- Capturing Category 1: Public Brand Homepage ---");
    {
      const context = await browser.newContext({
        viewport: { width: 1440, height: 1080 },
        deviceScaleFactor: 2,
      });
      const page = await context.newPage();
      await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
      await record(page, "01_homepage_desktop.png", { fullPage: false });

      // Click on first item card to open ItemSheet modal
      const itemCard = page.locator("button:has-text('Hamburg Döner'), [role='button']:has-text('Hamburg Döner'), div:has-text('Hamburg Döner')").first();
      if (await itemCard.count() > 0) {
        await itemCard.click().catch(() => {});
        await page.waitForTimeout(500);
        await record(page, "03_homepage_item_customization_modal.png");
        // Close modal if open
        const closeBtn = page.locator("button[aria-label='Close'], button:has-text('Close'), button:has-text('Cancel')").first();
        if (await closeBtn.count() > 0) await closeBtn.click().catch(() => {});
      }

      // Scroll down to Locations section
      const locationsHeading = page.locator("#locations").first();
      if (await locationsHeading.count() > 0) {
        await locationsHeading.scrollIntoViewIfNeeded().catch(() => {});
        await page.waitForTimeout(400);
        await record(page, "04_homepage_locations_section.png");
      }

      await context.close();
    }

    // Homepage Mobile View
    {
      const mobileContext = await browser.newContext({
        viewport: { width: 390, height: 844 }, // iPhone 14
        deviceScaleFactor: 3,
        isMobile: true,
        hasTouch: true,
      });
      const page = await mobileContext.newPage();
      await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
      await record(page, "02_homepage_mobile.png");
      await mobileContext.close();
    }

    // -------------------------------------------------------------
    // 2. ONLINE PRE-ORDER & SELF-ORDER KIOSK FLOW (/order)
    // -------------------------------------------------------------
    console.log("\n--- Capturing Category 2: Online Pre-Order & Kiosk Flow ---");
    {
      const context = await browser.newContext({
        viewport: { width: 1440, height: 900 },
        deviceScaleFactor: 2,
      });
      const page = await context.newPage();
      await page.goto(`${BASE_URL}/order`, { waitUntil: "networkidle" });
      await record(page, "05_online_order_desktop.png");

      // Enter vehicle plate (In progress feature)
      const vehicleInput = page.locator("input[placeholder*='car'], input[id*='vehicle'], input[name*='vehicle'], input[type='text']").first();
      if (await vehicleInput.count() > 0) {
        await vehicleInput.fill("CY-KGD-777 (Silver Golf)");
      }

      // Click on an item that has meal upgrade (e.g. Hamburg Döner)
      const addBtn = page.locator("button:has-text('Hamburg Döner'), button:has-text('Add')").first();
      if (await addBtn.count() > 0) {
        await addBtn.click().catch(() => {});
        await page.waitForTimeout(500);
        await record(page, "07_online_order_meal_upgrade_modal.png");

        // Click upgrade button or keep solo
        const upgradeBtn = page.locator("button:has-text('Make it a Menü'), button:has-text('Menü (+€3)'), button:has-text('Upgrade')").first();
        if (await upgradeBtn.count() > 0) {
          await upgradeBtn.click().catch(() => {});
        } else {
          const keepBtn = page.locator("button:has-text('Just the sandwich'), button:has-text('No thanks')").first();
          if (await keepBtn.count() > 0) await keepBtn.click().catch(() => {});
        }
      }

      // Add another item
      const secondAdd = page.locator("button:has-text('Add')").nth(1);
      if (await secondAdd.count() > 0) {
        await secondAdd.click().catch(() => {});
        await page.waitForTimeout(300);
        const upgradeBtn2 = page.locator("button:has-text('Make it a Menü'), button:has-text('Just the sandwich')").first();
        if (await upgradeBtn2.count() > 0) await upgradeBtn2.click().catch(() => {});
      }

      // Open Cart Drawer
      const cartBtn = page.locator("button:has-text('Review order'), button:has-text('Cart'), button[aria-label*='cart'], button:has-text('Bag')").first();
      if (await cartBtn.count() > 0) {
        await cartBtn.click().catch(() => {});
        await page.waitForTimeout(600);
        await record(page, "08_online_order_cart_drawer.png");

        // Click Place Order to show confirmation state
        const placeBtn = page.locator("button:has-text('Place pre-order'), button:has-text('Checkout'), button:has-text('Send order')").first();
        if (await placeBtn.count() > 0) {
          await placeBtn.click().catch(() => {});
          await page.waitForTimeout(600);
          await record(page, "09_online_order_placed_confirmation.png");
        }
      }

      await context.close();
    }

    // Order Mobile View
    {
      const mobileContext = await browser.newContext({
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 3,
        isMobile: true,
        hasTouch: true,
      });
      const page = await mobileContext.newPage();
      await page.goto(`${BASE_URL}/order`, { waitUntil: "networkidle" });
      await record(page, "06_online_order_mobile.png");
      await mobileContext.close();
    }

    // -------------------------------------------------------------
    // Authenticate Admin / Staff Context
    // -------------------------------------------------------------
    console.log("\n--- Authenticating session for Protected Operational Surfaces ---");
    const authContext = await browser.newContext({
      viewport: { width: 1180, height: 820 }, // iPad 10.9" landscape
      deviceScaleFactor: 2,
    });

    const loginRes = await authContext.request.post(`${BASE_URL}/api/auth/login`, {
      data: { username: "demo_owner", pin: "9999" },
    });
    console.log("  🔑 Login response status:", loginRes.status());

    // -------------------------------------------------------------
    // 3. POINT OF SALE (POS TILL - /pos)
    // -------------------------------------------------------------
    console.log("\n--- Capturing Category 3: Point of Sale (POS Till) ---");
    {
      const page = await authContext.newPage();
      await page.goto(`${BASE_URL}/pos`, { waitUntil: "networkidle" });
      await record(page, "10_pos_counter_till_overview.png");

      // Add a couple of items to cart on POS
      const productTiles = page.locator("button:has-text('€'), [role='button']:has-text('€')");
      const tileCount = await productTiles.count();
      if (tileCount > 0) {
        await productTiles.first().click().catch(() => {});
        await page.waitForTimeout(300);
        // If modifier modal opened, click confirm or close
        const confirmMod = page.locator("button:has-text('Add to order'), button:has-text('Confirm'), button:has-text('Done')").first();
        if (await confirmMod.count() > 0) await confirmMod.click().catch(() => {});

        if (tileCount > 1) {
          await productTiles.nth(1).click().catch(() => {});
          await page.waitForTimeout(300);
          const confirmMod2 = page.locator("button:has-text('Add to order'), button:has-text('Confirm'), button:has-text('Done')").first();
          if (await confirmMod2.count() > 0) await confirmMod2.click().catch(() => {});
        }
      }
      await record(page, "11_pos_counter_till_active_cart.png");

      // Click Cash payment to show Tender Keypad
      const cashBtn = page.locator("button:has-text('CASH'), button:has-text('Cash')").first();
      if (await cashBtn.count() > 0) {
        await cashBtn.click().catch(() => {});
        await page.waitForTimeout(400);
        await record(page, "12_pos_counter_till_tender_keypad.png");
      }

      await page.close();
    }

    // -------------------------------------------------------------
    // 4. KITCHEN DISPLAY SYSTEM (KDS - /kds, /kds/indoor, /kds/grill)
    // -------------------------------------------------------------
    console.log("\n--- Capturing Category 4: Kitchen Display System (KDS) ---");
    {
      const kdsContext = await browser.newContext({
        viewport: { width: 1366, height: 768 },
        deviceScaleFactor: 2,
      });
      // Share cookies
      const cookies = await authContext.cookies();
      await kdsContext.addCookies(cookies);

      // KDS Hub / All Stations
      const page = await kdsContext.newPage();
      await page.goto(`${BASE_URL}/kds`, { waitUntil: "networkidle" });
      await record(page, "13_kds_all_stations_hub.png");

      // KDS Indoor Station
      await page.goto(`${BASE_URL}/kds/indoor`, { waitUntil: "networkidle" });
      await record(page, "14_kds_assembly_station.png");

      // KDS Grill Station
      await page.goto(`${BASE_URL}/kds/grill`, { waitUntil: "networkidle" });
      await record(page, "15_kds_grill_station.png");

      await kdsContext.close();
    }

    // -------------------------------------------------------------
    // 5. CUSTOMER QUEUE STATUS SCREEN (/display)
    // -------------------------------------------------------------
    console.log("\n--- Capturing Category 5: Customer Queue Status Display ---");
    {
      const tvContext = await browser.newContext({
        viewport: { width: 1920, height: 1080 }, // 1080p / 4K ratio
        deviceScaleFactor: 1.5,
      });
      const page = await tvContext.newPage();
      await page.goto(`${BASE_URL}/display`, { waitUntil: "networkidle" });
      await record(page, "16_customer_wait_display_board.png");
      await tvContext.close();
    }

    // -------------------------------------------------------------
    // 6. DIGITAL 4K MENU BOARDS SIGNAGE (/boards)
    // -------------------------------------------------------------
    console.log("\n--- Capturing Category 6: Digital 4K Menu Boards ---");
    {
      const tvContext = await browser.newContext({
        viewport: { width: 1920, height: 1080 },
        deviceScaleFactor: 1.5,
      });
      const page = await tvContext.newPage();
      await page.goto(`${BASE_URL}/boards`, { waitUntil: "networkidle" });

      // Move mouse to show controls initially or capture clean screen 1
      await record(page, "17_menu_board_screen1_doener.png");

      // Trigger navigation to screen 2
      await page.keyboard.press("ArrowRight");
      await page.waitForTimeout(600);
      await record(page, "18_menu_board_screen2_duerum_bowls.png");

      // Navigate to screen 3
      await page.keyboard.press("ArrowRight");
      await page.waitForTimeout(600);
      await record(page, "19_menu_board_screen3_burgers_pizzas.png");

      // Navigate to screen 4
      await page.keyboard.press("ArrowRight");
      await page.waitForTimeout(600);
      await record(page, "20_menu_board_screen4_drinks_specials.png");

      // Toggle Graphic Mode if button or key available
      const graphicToggle = page.locator("button:has-text('GRAPHIC'), button:has-text('Graphic')").first();
      if (await graphicToggle.count() > 0) {
        await graphicToggle.click().catch(() => {});
      } else {
        await page.keyboard.press("g").catch(() => {});
      }
      await page.waitForTimeout(600);
      await record(page, "21_menu_board_graphic_hero_mode.png");

      await tvContext.close();
    }

    // -------------------------------------------------------------
    // 7. STAFF OPERATIONS TABLET (/staff)
    // -------------------------------------------------------------
    console.log("\n--- Capturing Category 7: Staff Operations Tablet ---");
    {
      const staffContext = await browser.newContext({
        viewport: { width: 1280, height: 800 }, // 10.1" tablet
        deviceScaleFactor: 2,
      });
      const cookies = await authContext.cookies();
      await staffContext.addCookies(cookies);

      const page = await staffContext.newPage();
      await page.goto(`${BASE_URL}/staff`, { waitUntil: "networkidle" });
      await record(page, "22_staff_hub_timeclock.png");

      // Switch to HACCP tab
      const haccpTab = page.locator("button:has-text('HACCP'), [role='tab']:has-text('HACCP')").first();
      if (await haccpTab.count() > 0) {
        await haccpTab.click().catch(() => {});
        await page.waitForTimeout(500);
        await record(page, "23_staff_hub_haccp_temperature_log.png");
      }

      // Switch to CHECKLIST tab
      const checklistTab = page.locator("button:has-text('CHECKLIST'), [role='tab']:has-text('CHECKLIST')").first();
      if (await checklistTab.count() > 0) {
        await checklistTab.click().catch(() => {});
        await page.waitForTimeout(500);
        await record(page, "24_staff_hub_daily_checklist.png");
      }

      await staffContext.close();
    }

    // -------------------------------------------------------------
    // 8. ADMIN & BACKOFFICE DASHBOARD (/admin, /admin/menu-boards, /admin/suppliers)
    // -------------------------------------------------------------
    console.log("\n--- Capturing Category 8: Admin & Backoffice Dashboard ---");
    {
      const adminContext = await browser.newContext({
        viewport: { width: 1440, height: 950 },
        deviceScaleFactor: 2,
      });
      const cookies = await authContext.cookies();
      await adminContext.addCookies(cookies);

      const page = await adminContext.newPage();

      // BI Dashboard Overview
      await page.goto(`${BASE_URL}/admin`, { waitUntil: "networkidle" });
      await record(page, "25_admin_bi_overview.png");

      // Switch to MENU tab (Menu Recipe Manager / Single Source of Truth)
      const menuTab = page.locator("button:has-text('MENU'), [role='tab']:has-text('MENU'), button:has-text('Recipe')").first();
      if (await menuTab.count() > 0) {
        await menuTab.click().catch(() => {});
        await page.waitForTimeout(600);
        await record(page, "26_admin_menu_recipe_manager.png");
      }

      // Switch to INVENTORY tab (Inventory & Stock Manager)
      const inventoryTab = page.locator("button:has-text('INVENTORY'), [role='tab']:has-text('INVENTORY')").first();
      if (await inventoryTab.count() > 0) {
        await inventoryTab.click().catch(() => {});
        await page.waitForTimeout(600);
        await record(page, "27_admin_inventory_stock_manager.png");
      }

      // Dedicated Menu Boards CMS (/admin/menu-boards)
      await page.goto(`${BASE_URL}/admin/menu-boards`, { waitUntil: "networkidle" });
      await record(page, "28_admin_menu_boards_cms.png");

      // Dedicated Suppliers & Purchase Orders (/admin/suppliers)
      await page.goto(`${BASE_URL}/admin/suppliers`, { waitUntil: "networkidle" });
      await record(page, "29_admin_suppliers_po_system.png");

      await adminContext.close();
    }

    // -------------------------------------------------------------
    // 9. AUTHENTICATION & DESIGN SYSTEM GALLERY (/login, /dev/ui)
    // -------------------------------------------------------------
    console.log("\n--- Capturing Category 9: Authentication & Design System ---");
    {
      const publicContext = await browser.newContext({
        viewport: { width: 1200, height: 800 },
        deviceScaleFactor: 2,
      });
      const page = await publicContext.newPage();

      // Login page
      await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" });
      await record(page, "30_staff_owner_login.png");

      await publicContext.close();
    }

    // UI Gallery Light & Dark
    {
      const uiContext = await browser.newContext({
        viewport: { width: 1440, height: 1000 },
        deviceScaleFactor: 2,
        colorScheme: "light",
      });
      await uiContext.addInitScript(() => window.localStorage.setItem("mygd.theme.admin", "light"));
      const page = await uiContext.newPage();
      await page.goto(`${BASE_URL}/dev/ui`, { waitUntil: "networkidle" });
      await record(page, "31_design_system_ui_gallery_light.png", { fullPage: true });
      await uiContext.close();
    }

    {
      const uiContextDark = await browser.newContext({
        viewport: { width: 1440, height: 1000 },
        deviceScaleFactor: 2,
        colorScheme: "dark",
      });
      await uiContextDark.addInitScript(() => window.localStorage.setItem("mygd.theme.admin", "dark"));
      const page = await uiContextDark.newPage();
      await page.goto(`${BASE_URL}/dev/ui`, { waitUntil: "networkidle" });
      await record(page, "32_design_system_ui_gallery_dark.png", { fullPage: true });
      await uiContextDark.close();
    }

    console.log("\n✨ ALL SCREENSHOTS SUCCESSFULLY CAPTURED!");
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error("❌ Fatal error capturing screenshots:", err);
  process.exit(1);
});
