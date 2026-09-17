const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const FFMPEG_PATH = 'C:\\Python314\\Lib\\site-packages\\imageio_ffmpeg\\binaries\\ffmpeg-win-x86_64-v7.1.exe';
const AUDIO_FILE = 'C:\\Users\\awesh\\Desktop\\Satah Invoice - Copy\\Inventory Module  Final VoiceOverTutorial.mp3.mpeg';
const OUTPUT_MP4 = 'C:\\Users\\awesh\\Desktop\\Satah Invoice - Copy\\Inventory_Module_Tutorial_Video.mp4';
const TEMP_DIR = path.join(__dirname, 'temp_video_rec');

if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

fs.readdirSync(TEMP_DIR).forEach(f => {
  try { fs.unlinkSync(path.join(TEMP_DIR, f)); } catch(e) {}
});

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

(async () => {
  console.log("=== Starting Inventory Module Tutorial Recording ===");
  console.log("Target Audio Duration: 90.17 seconds");

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    recordVideo: {
      dir: TEMP_DIR,
      size: { width: 1920, height: 1080 }
    },
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1
  });

  const page = await context.newPage();
  page.setDefaultTimeout(6000);

  async function initCursor() {
    await page.evaluate(() => {
      let cursor = document.getElementById('custom-mouse-pointer');
      if (!cursor) {
        cursor = document.createElement('div');
        cursor.id = 'custom-mouse-pointer';
        cursor.style.position = 'fixed';
        cursor.style.width = '24px';
        cursor.style.height = '24px';
        cursor.style.borderRadius = '50%';
        cursor.style.backgroundColor = 'rgba(79, 70, 229, 0.9)';
        cursor.style.border = '3px solid #ffffff';
        cursor.style.boxShadow = '0 0 16px rgba(79, 70, 229, 0.8), 0 4px 12px rgba(0,0,0,0.35)';
        cursor.style.pointerEvents = 'none';
        cursor.style.zIndex = '9999999';
        cursor.style.transform = 'translate(-50%, -50%)';
        cursor.style.transition = 'width 0.12s, height 0.12s, background-color 0.12s';
        cursor.style.left = '960px';
        cursor.style.top = '540px';
        document.body.appendChild(cursor);

        window.__triggerClickAnim = (x, y) => {
          const ripple = document.createElement('div');
          ripple.style.position = 'fixed';
          ripple.style.left = x + 'px';
          ripple.style.top = y + 'px';
          ripple.style.width = '30px';
          ripple.style.height = '30px';
          ripple.style.borderRadius = '50%';
          ripple.style.backgroundColor = 'rgba(99, 102, 241, 0.5)';
          ripple.style.transform = 'translate(-50%, -50%) scale(1)';
          ripple.style.transition = 'all 0.4s ease-out';
          ripple.style.pointerEvents = 'none';
          ripple.style.zIndex = '9999998';
          document.body.appendChild(ripple);
          setTimeout(() => {
            ripple.style.transform = 'translate(-50%, -50%) scale(2.5)';
            ripple.style.opacity = '0';
          }, 10);
          setTimeout(() => ripple.remove(), 450);
        };
      }
    }).catch(() => {});
  }

  let currentX = 960;
  let currentY = 540;

  async function moveTo(targetX, targetY, durationMs = 600) {
    const steps = Math.max(12, Math.floor(durationMs / 30));
    const stepDuration = durationMs / steps;
    const startX = currentX;
    const startY = currentY;

    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      const x = Math.round(startX + (targetX - startX) * ease);
      const y = Math.round(startY + (targetY - startY) * ease);

      await page.evaluate(({ cx, cy }) => {
        const c = document.getElementById('custom-mouse-pointer');
        if (c) {
          c.style.left = cx + 'px';
          c.style.top = cy + 'px';
        }
      }, { cx: x, cy: y }).catch(() => {});

      currentX = x;
      currentY = y;
      await sleep(stepDuration);
    }
  }

  async function pointAndClick(selector, moveDuration = 600) {
    try {
      const el = page.locator(selector).first();
      const box = await el.boundingBox().catch(() => null);
      if (box) {
        await moveTo(Math.round(box.x + box.width / 2), Math.round(box.y + box.height / 2), moveDuration);
        await page.evaluate(({ cx, cy }) => {
          if (window.__triggerClickAnim) window.__triggerClickAnim(cx, cy);
        }, { cx: currentX, cy: currentY }).catch(() => {});
      }
      await el.click({ force: true }).catch(() => {});
      await sleep(150);
    } catch(e) {
      console.warn("pointAndClick failed for:", selector);
    }
  }

  async function pointAndHover(selector, durationMs = 700) {
    try {
      const el = page.locator(selector).first();
      const box = await el.boundingBox().catch(() => null);
      if (box) {
        await moveTo(Math.round(box.x + box.width / 2), Math.round(box.y + box.height / 2), durationMs);
      }
    } catch(e) {
      console.warn("pointAndHover failed for:", selector);
    }
  }

  async function pointAndType(selector, text, moveDuration = 500) {
    try {
      const el = page.locator(selector).first();
      const box = await el.boundingBox().catch(() => null);
      if (box) {
        await moveTo(Math.round(box.x + box.width / 2), Math.round(box.y + box.height / 2), moveDuration);
      }
      await el.click({ force: true }).catch(() => {});
      await el.fill('');
      for (const char of text) {
        await page.keyboard.type(char);
        await sleep(65);
      }
      await sleep(150);
    } catch(e) {
      console.warn("pointAndType failed for:", selector);
    }
  }

  // --- Step 0: Login ---
  console.log("1. Logging in...");
  await page.goto('http://localhost:8081/login');
  await page.fill('input[type="email"]', 'awesh.etpl@gmail.com');
  await page.fill('input[type="password"]', '123456@Ak');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);

  // Set up dashboard initial view
  await page.goto('http://localhost:8081/dashboard');
  await page.waitForTimeout(2000);
  await initCursor();

  const recordStart = Date.now();
  console.log(">>> [0.00s] RECORDING TIMELINE STARTED <<<");

  // ==========================================
  // 1. TIMELINE 0:00 - 0:08 (Intro & Welcome)
  // "Welcome Assay Biz tutorial series mein aapka swagat hai. Is video mein hum inventory module ko step-by-step samjhenge."
  // ==========================================
  console.log("[0:00 - 0:08] Intro on Dashboard...");
  await moveTo(850, 280, 1500);
  await sleep(1500);
  await moveTo(450, 380, 1200);
  await sleep(1200);

  // Transition to Inventory page
  console.log("Navigating to /inventory...");
  await page.goto('http://localhost:8081/inventory');
  await page.waitForTimeout(1000);
  await initCursor();

  while ((Date.now() - recordStart) < 8000) { await sleep(50); }

  // ==========================================
  // 2. TIMELINE 0:08 - 0:17 (Inventory Section & 4 Overview KPI Cards)
  // "Sabse pehle Inventory section open karein. Yahan aapko Products, Services, Low Stock, aur Inventory Value ka quick overview dikhayi dega."
  // ==========================================
  console.log("[0:08 - 0:17] Highlighting 4 Overview Cards...");
  await pointAndHover('text=PRODUCTS', 1100);
  await sleep(1100);

  await pointAndHover('text=SERVICES', 1100);
  await sleep(1100);

  await pointAndHover('text=LOW STOCK', 1100);
  await sleep(1100);

  await pointAndHover('text=INVENTORY VALUE', 1100);
  await sleep(1000);

  while ((Date.now() - recordStart) < 17500) { await sleep(50); }

  // ==========================================
  // 3. TIMELINE 0:17 - 0:30 (Add Product & Basic Details)
  // "Ab naya item add karne ke liye 'Add Product' par click karein. Sabse pehle Product ya Service select karein. Iske baad Item Name, Sales Price, GST Rate, Measuring Unit, aur Opening Stock ki details enter karein."
  // ==========================================
  console.log("[0:17 - 0:30] Add Product & Basic Details...");
  await pointAndClick('button:has-text("Add Product")', 1000);
  await sleep(1200);
  await initCursor();

  // Highlight Product Radio
  await pointAndClick('#r1', 700);
  await sleep(500);

  // Item Name
  await pointAndType('input[placeholder*="Maggie"]', 'Premium Wireless Mouse', 600);
  await sleep(500);

  // Sales Price
  await pointAndType('input[placeholder*="200"]', '1299', 600);
  await sleep(500);

  // Measuring Unit hover
  await pointAndHover('button:has-text("PCS"), [placeholder*="Pieces"]', 600);
  await sleep(700);

  // Opening Stock
  await pointAndType('input[placeholder*="150"]', '50', 600);

  while ((Date.now() - recordStart) < 30500) { await sleep(50); }

  // ==========================================
  // 4. TIMELINE 0:30 - 0:45 (Stock Details Tab)
  // "Ab Stock Details mein jaakar Item Code, HSN Code, aur Opening Stock ki information add karein. Agar zaroorat ho to Expiry Date aur Low Stock Warning bhi enable kar sakte hain."
  // ==========================================
  console.log("[0:30 - 0:45] Stock Details (SKU, HSN, Low Stock Warning, Expiry)...");
  await pointAndClick('button:has-text("Stock Details")', 800);
  await sleep(800);

  // Item Code (SKU)
  await pointAndType('input[placeholder*="ITM12549"]', 'SKU-WM-900', 600);
  await sleep(600);

  // HSN Code
  await pointAndType('input[placeholder*="4010"]', '8471', 600);
  await sleep(800);

  // Hover over Low Stock Warning / Expiry toggles
  await moveTo(900, 520, 900);
  await sleep(1500);
  await moveTo(900, 640, 900);
  await sleep(1800);

  while ((Date.now() - recordStart) < 45500) { await sleep(50); }

  // ==========================================
  // 5. TIMELINE 0:45 - 0:58 (Pricing Details & Party-wise Prices)
  // "Iske baad Pricing Details mein Sales Price, Purchase Price, GST, aur Discount set karein. Agar kisi specific customer ya vendor ke liye alag price rakhna hai, to Party-wise Prices ka use karein."
  // ==========================================
  console.log("[0:45 - 0:58] Pricing Details & Party-wise Prices...");
  await pointAndClick('button:has-text("Pricing Details")', 800);
  await sleep(1000);

  // Purchase Price
  const pInput = page.locator('input[type="number"]').first();
  if (await pInput.count() > 0) {
    await pointAndType(pInput, '799', 600);
  }
  await sleep(1500);

  // Party-wise Prices Tab click
  console.log("Showing Party Wise Prices...");
  await pointAndClick('button:has-text("Party Wise Prices")', 800);
  await sleep(2500);

  while ((Date.now() - recordStart) < 58500) { await sleep(50); }

  // ==========================================
  // 6. TIMELINE 0:58 - 1:07 (Custom Fields & Save Item)
  // "Additional information ke liye Custom Fields add kar sakte hain. Saari details complete karne ke baad 'Save Item' par click karein."
  // ==========================================
  console.log("[0:58 - 1:07] Custom Fields & Save Item...");
  await pointAndClick('button:has-text("Custom Fields")', 800);
  await sleep(1800);

  // Save Item Button Click
  console.log("Clicking Save Item button...");
  await pointAndClick('button:has-text("Save Item")', 1000);
  await sleep(2200);

  while ((Date.now() - recordStart) < 67500) { await sleep(50); }

  // ==========================================
  // 7. TIMELINE 1:07 - 1:19 (Inventory List, Search, Filter, Actions)
  // "Ab aapka item inventory list mein dikhayi dega. Yahan se aap apne items ko Search, Filter, Edit, ya Delete kar sakte hain."
  // ==========================================
  console.log("[1:07 - 1:19] Live Search, Filter & Actions...");
  await initCursor();

  // Search input typing
  const searchInput = page.locator('input[placeholder*="Search"]').first();
  await pointAndType(searchInput, 'Wireless Mouse', 600);
  await sleep(1200);

  // Clear search smoothly
  await searchInput.fill('');
  await sleep(600);

  // Filter tabs hover
  await pointAndHover('button[role="tab"]:has-text("Products"), [value="products"]', 800);
  await sleep(900);

  // Action icons hover
  const actBtn = page.locator('button:has(svg.lucide-pencil), button:has(svg.lucide-wrench), button:has-text("Edit")').first();
  if (await actBtn.count() > 0) {
    await pointAndHover(actBtn, 800);
    await sleep(800);
  }

  while ((Date.now() - recordStart) < 79500) { await sleep(50); }

  // ==========================================
  // 8. TIMELINE 1:19 - 1:30.2 (Outro & Final Brand Overview)
  // "Is tarah Assay Biz ki madad se aap apni inventory ko aasani se manage aur track kar sakte hain. Assay Biz: One Platform, Smarter Business, Better Growth."
  // ==========================================
  console.log("[1:19 - 1:30.2] Outro & Brand Overview...");
  await moveTo(960, 260, 2000);
  await sleep(2000);
  await moveTo(960, 480, 2000);

  // Pad to exactly 90.3 seconds to match audio duration
  while ((Date.now() - recordStart) < 90300) {
    await sleep(50);
  }

  const finalDuration = (Date.now() - recordStart) / 1000;
  console.log(`Finished recording! Total Duration: ${finalDuration.toFixed(2)} seconds`);

  await page.close();
  await context.close();
  await browser.close();

  // Find generated webm
  const webmFiles = fs.readdirSync(TEMP_DIR).filter(f => f.endsWith('.webm'));
  if (webmFiles.length === 0) {
    throw new Error("No webm video found in temp dir!");
  }
  const rawVideoPath = path.join(TEMP_DIR, webmFiles[0]);
  console.log("Raw video path:", rawVideoPath);

  // Merge with Audio using FFmpeg
  console.log("Encoding and merging audio with video via FFmpeg...");
  const ffmpegCmd = [
    '-y',
    '-i', rawVideoPath,
    '-i', AUDIO_FILE,
    '-c:v', 'libx264',
    '-preset', 'fast',
    '-crf', '19',
    '-pix_fmt', 'yuv420p',
    '-c:a', 'aac',
    '-b:a', '192k',
    '-shortest',
    OUTPUT_MP4
  ];

  const res = spawnSync(FFMPEG_PATH, ffmpegCmd, { stdio: 'inherit' });
  if (res.status === 0) {
    const stats = fs.statSync(OUTPUT_MP4);
    console.log("=================================================");
    console.log(">>> TUTORIAL VIDEO CREATED SUCCESSFULLY! <<<");
    console.log("Location:", OUTPUT_MP4);
    console.log("Size:", (stats.size / (1024 * 1024)).toFixed(2), "MB");
    console.log("=================================================");
  } else {
    console.error("FFmpeg exited with error code:", res.status);
  }
})();
