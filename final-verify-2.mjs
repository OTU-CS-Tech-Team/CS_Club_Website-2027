import { chromium } from 'playwright';

const SCREENSHOTS_DIR = '/opt/cursor/artifacts/screenshots';

async function main() {
  const browser = await chromium.launch({ headless: true });
  
  try {
    // 5. Contact at 1280x800
    console.log('5. Contact 1280x800...');
    let page = await browser.newPage();
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('http://localhost:3000/contact', { waitUntil: 'load', timeout: 60000 });
    await page.waitForTimeout(4000);
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/final-contact-1280.png`, timeout: 60000 });
    await page.close();
    
    // 6. ANIMATION TEST with real keystrokes
    console.log('6. Animation test with real keystrokes...');
    page = await browser.newPage();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('http://localhost:3000/contact', { waitUntil: 'load', timeout: 60000 });
    await page.waitForTimeout(3000);
    
    // Open modal
    const openModalBtn = page.locator('text=Write a letter').first();
    await openModalBtn.waitFor({ state: 'visible', timeout: 10000 });
    await openModalBtn.click();
    await page.waitForTimeout(1500);
    
    // Click a category button
    console.log('   Clicking category...');
    const categoryBtn = page.locator('button:has-text("Event")').first();
    await categoryBtn.waitFor({ state: 'visible', timeout: 5000 });
    await categoryBtn.click();
    await page.waitForTimeout(500);
    
    // Type message with real keystrokes using pressSequentially
    console.log('   Typing message with pressSequentially...');
    const textarea = page.locator('textarea').first();
    await textarea.waitFor({ state: 'visible', timeout: 5000 });
    await textarea.click();
    await page.waitForTimeout(300);
    
    // Use pressSequentially for real keystroke simulation
    await textarea.pressSequentially('This is a test message for the animation verification. Testing the fold and fly animation.', { delay: 20 });
    await page.waitForTimeout(500);
    
    // Screenshot before send
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/final-anim-before.png`, timeout: 60000 });
    
    // Wait more than 3 seconds (the MIN_FILL_TIME_MS check)
    console.log('   Waiting 4 seconds for timing check...');
    await page.waitForTimeout(4000);
    
    // Click send button
    const sendBtn = page.locator('button:has-text("Seal")').first();
    await sendBtn.waitFor({ state: 'visible', timeout: 5000 });
    console.log('   Clicking send...');
    await sendBtn.click();
    
    // Capture fold phase quickly - animation starts immediately on submit
    console.log('   Capturing animation frames...');
    await page.waitForTimeout(150);
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/final-anim-fold.png`, timeout: 60000 });
    
    // Capture fly phase
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/final-anim-fly.png`, timeout: 60000 });
    
    // Capture more frames
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/final-anim-mid.png`, timeout: 60000 });
    
    // Capture end state
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/final-anim-end.png`, timeout: 60000 });
    
    await page.close();
    
    console.log('\nAll screenshots captured!');
    
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
