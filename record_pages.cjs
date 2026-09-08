const fs = require('fs');
const { chromium } = require('@playwright/test');
const path = require('path');

(async () => {
  // Extract routes
  const content = fs.readFileSync('src/App.tsx', 'utf8');
  const matches = [...content.matchAll(/path="(\/[^"]*)"/g)];
  const routes = matches.map(m => m[1]);
  let staticRoutes = [...new Set(routes.filter(r => !r.includes(':') && !r.includes('*')))];
  
  // Filter out some pages we don't want to show or that trigger auth redirects if not careful
  const skip = ['/login', '/register', '/forgot-password', '/reset-password', '/demo', '/try', '/auth/callback', '/invite'];
  staticRoutes = staticRoutes.filter(r => !skip.includes(r));
  
  console.log('Total static routes to visit:', staticRoutes.length);

  const artifactsDir = 'C:\\Users\\awesh\\.gemini\\antigravity\\brain\\41fb231a-181b-40e1-b44c-2fb7960a84e2';
  const videoDir = path.join(artifactsDir, 'videos');
  if (!fs.existsSync(videoDir)) {
    fs.mkdirSync(videoDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    recordVideo: {
      dir: videoDir,
      size: { width: 1280, height: 720 }
    },
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  
  try {
    console.log('Navigating to login...');
    await page.goto('http://localhost:8081/login');
    
    // Login
    await page.fill('input[type="email"]', 'awesh.etpl@gmail.com');
    await page.fill('input[type="password"]', '123456@Ak');
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(3000);
    
    // Check if business selection exists
    const businessCard = page.locator('text=new business');
    if (await businessCard.count() > 0) {
      console.log('Selecting business...');
      await businessCard.first().click();
      await page.waitForTimeout(2000);
    }
    
    // Visit each route
    for (const route of staticRoutes) {
      console.log('Visiting:', route);
      try {
        await page.goto('http://localhost:8081' + route, { timeout: 5000 });
        await page.waitForTimeout(800); // Wait 800ms to let page render
      } catch (e) {
        console.error('Failed to visit:', route, e.message);
      }
    }
    
  } catch (err) {
    console.error('Error during automation:', err);
  } finally {
    await page.close();
    await context.close(); // Saves the video
    await browser.close();
    
    // Copy the video file
    const files = fs.readdirSync(videoDir);
    const videoFile = files.find(f => f.endsWith('.webm'));
    if (videoFile) {
      const srcPath = path.join(videoDir, videoFile);
      const destPath = path.join(artifactsDir, 'all_pages_tour.webm');
      fs.copyFileSync(srcPath, destPath);
      console.log('Video saved to:', destPath);
    }
  }
})();
