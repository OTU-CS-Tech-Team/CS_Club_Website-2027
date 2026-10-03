import { chromium } from 'playwright';

const SCREENSHOTS_DIR = '/opt/cursor/artifacts/screenshots';

async function main() {
  const browser = await chromium.launch({ headless: true });
  
  try {
    // 1. Contact page at 390x844 - top of page
    console.log('1. Contact 390x844 top...');
    let page = await browser.newPage();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('http://localhost:3000/contact', { waitUntil: 'load', timeout: 60000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/final-contact-390-top.png` });
    
    // 1b. Contact page at 390x844 - full page
    console.log('1b. Contact 390x844 full page...');
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/final-contact-390-full.png`, fullPage: true });
    
    // 2. Letter modal open at 390x844
    console.log('2. Letter modal at 390x844...');
    const writeButton = page.locator('text=Write a letter').first();
    await writeButton.waitFor({ state: 'visible', timeout: 10000 });
    await writeButton.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/final-modal-390.png` });
    await page.close();
    
    // 3. Hamburger menu open at 390px
    console.log('3. Hamburger menu at 390px...');
    page = await browser.newPage();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('http://localhost:3000/', { waitUntil: 'load', timeout: 60000 });
    await page.waitForTimeout(2000);
    // Look for menuToggle class button
    const menuButton = page.locator('[class*="menuToggle"]').first();
    // Force click even if not visible (CSS might be display:none at load)
    await menuButton.click({ force: true });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/final-menu-390.png` });
    await page.close();
    
    // 4. Contact at 820x1180
    console.log('4. Contact 820x1180...');
    page = await browser.newPage();
    await page.setViewportSize({ width: 820, height: 1180 });
    await page.goto('http://localhost:3000/contact', { waitUntil: 'load', timeout: 60000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/final-contact-820.png` });
    await page.close();
    
    // 5. Contact at 1280x800
    console.log('5. Contact 1280x800...');
    page = await browser.newPage();
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('http://localhost:3000/contact', { waitUntil: 'load', timeout: 60000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/final-contact-1280.png` });
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
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/final-anim-before.png` });
    
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
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/final-anim-fold.png` });
    
    // Capture fly phase
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/final-anim-fly.png` });
    
    // Capture more frames
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/final-anim-mid.png` });
    
    // Capture end state
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/final-anim-end.png` });
    
    await page.close();
    
    console.log('\nAll screenshots captured!');
    
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
