import { chromium } from 'playwright';
import * as fs from 'fs';

const SCREENSHOTS_DIR = '/opt/cursor/artifacts/screenshots';

async function quickScreenshot(page, path) {
  const cdp = await page.context().newCDPSession(page);
  const { data } = await cdp.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path, Buffer.from(data, 'base64'));
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  
  try {
    console.log('Animation test...');
    const page = await browser.newPage();
    await page.setViewportSize({ width: 390, height: 844 });
    
    console.log('   Navigating...');
    await page.goto('http://localhost:3000/contact', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(6000);
    
    // Click the Write a letter button using JavaScript
    console.log('   Opening modal...');
    await page.evaluate(() => {
      const buttons = document.querySelectorAll('button');
      for (const btn of buttons) {
        if (btn.textContent?.includes('Write a letter')) {
          btn.click();
          break;
        }
      }
    });
    await page.waitForTimeout(2000);
    
    await quickScreenshot(page, `${SCREENSHOTS_DIR}/final-anim-modal.png`);
    
    // Check if modal is open
    const hasTextarea = await page.locator('textarea').count();
    console.log(`   Modal check: textarea count = ${hasTextarea}`);
    
    if (hasTextarea === 0) {
      console.log('   ERROR: Could not open modal');
      await page.close();
      return;
    }
    
    // Click Event idea category
    console.log('   Clicking category...');
    await page.evaluate(() => {
      const labels = document.querySelectorAll('label');
      for (const l of labels) {
        if (l.textContent?.includes('Event idea')) {
          l.click();
          break;
        }
      }
    });
    await page.waitForTimeout(300);
    
    // Set message
    console.log('   Setting message...');
    await page.evaluate(() => {
      const textarea = document.querySelector('textarea');
      if (textarea) {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
        setter?.call(textarea, 'Test animation message');
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    await page.waitForTimeout(300);
    
    await quickScreenshot(page, `${SCREENSHOTS_DIR}/final-anim-before.png`);
    console.log('   Captured before');
    
    // Wait for timing check
    console.log('   Waiting 4 seconds...');
    await page.waitForTimeout(4000);
    
    // Click send
    console.log('   Clicking send...');
    await page.evaluate(() => {
      const btn = document.querySelector('button[type="submit"]');
      if (btn) btn.click();
    });
    
    // Capture frames quickly using CDP
    console.log('   Capturing frames...');
    await page.waitForTimeout(100);
    await quickScreenshot(page, `${SCREENSHOTS_DIR}/final-anim-fold.png`);
    console.log('   fold captured');
    
    await page.waitForTimeout(400);
    await quickScreenshot(page, `${SCREENSHOTS_DIR}/final-anim-fly.png`);
    console.log('   fly captured');
    
    await page.waitForTimeout(400);
    await quickScreenshot(page, `${SCREENSHOTS_DIR}/final-anim-mid.png`);
    console.log('   mid captured');
    
    await page.waitForTimeout(800);
    await quickScreenshot(page, `${SCREENSHOTS_DIR}/final-anim-end.png`);
    console.log('   end captured');
    
    console.log('\nDone!');
    await page.close();
    
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
