// MY GERMAN DÖNER — Multi-Viewport Automation & Video Demo Recorder
// Walks through all 5 key viewports and records user flow interactions

import { chromium } from "playwright";

async function recordWalkthrough() {
  console.log("🎬 Starting MY GERMAN DÖNER Automated Walkthrough Recording...");
  const browser = await chromium.launch({ headless: true });
  
  // 1. Portrait Kiosk (1080x1920)
  const kioskContext = await browser.newContext({
    viewport: { width: 1080, height: 1920 },
    recordVideo: { dir: "./recordings", size: { width: 1080, height: 1920 } },
  });
  const kioskPage = await kioskContext.newPage();
  console.log("📱 Viewport 1: Portrait Touchscreen Kiosk (1080x1920)");
  await kioskPage.goto("http://localhost:3000/");
  await kioskPage.waitForTimeout(2000);
  await kioskPage.screenshot({ path: "./recordings/01_kiosk_attract.png" });
  await kioskContext.close();

  // 2. Landscape POS Till (1024x768)
  const posContext = await browser.newContext({
    viewport: { width: 1024, height: 768 },
    recordVideo: { dir: "./recordings", size: { width: 1024, height: 768 } },
  });
  const posPage = await posContext.newPage();
  console.log("💻 Viewport 2: Countertop POS Till (1024x768)");
  await posPage.goto("http://localhost:3000/pos");
  await posPage.waitForTimeout(2000);
  await posPage.screenshot({ path: "./recordings/02_counter_pos.png" });
  await posContext.close();

  // 3. Kitchen KDS (1920x1080)
  const kdsContext = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: { dir: "./recordings", size: { width: 1920, height: 1080 } },
  });
  const kdsPage = await kdsContext.newPage();
  console.log("🍳 Viewport 3: Kitchen Display System (1920x1080)");
  await kdsPage.goto("http://localhost:3000/kds");
  await kdsPage.waitForTimeout(2000);
  await kdsPage.screenshot({ path: "./recordings/03_kitchen_kds.png" });
  await kdsContext.close();

  // 4. Customer Display TV (1920x1080)
  const tvContext = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: { dir: "./recordings", size: { width: 1920, height: 1080 } },
  });
  const tvPage = await tvContext.newPage();
  console.log("📺 Viewport 4: Customer Order Status TV Board (1920x1080)");
  await tvPage.goto("http://localhost:3000/display");
  await tvPage.waitForTimeout(2000);
  await tvPage.screenshot({ path: "./recordings/04_customer_tv.png" });
  await tvContext.close();

  // 5. Store Manager Backoffice (1440x900)
  const adminContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: { dir: "./recordings", size: { width: 1440, height: 900 } },
  });
  const adminPage = await adminContext.newPage();
  console.log("📊 Viewport 5: Store Manager Admin & Analytics (1440x900)");
  await adminPage.goto("http://localhost:3000/admin");
  await adminPage.waitForTimeout(2000);
  await adminPage.screenshot({ path: "./recordings/05_admin_portal.png" });
  await adminContext.close();

  await browser.close();
  console.log("✅ Automated Walkthrough recordings & high-res screenshots saved to ./recordings");
}

export default recordWalkthrough;
