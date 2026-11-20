import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

async function testCheckout() {
  console.log('--- Starting Playwright Checkout Verification ---');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }, // Mobile viewport (iPhone 13/14)
    deviceScaleFactor: 2,
  });

  const page = await context.newPage();
  
  // 1. Navigate to checkout
  console.log('Navigating to http://localhost:7847/checkout...');
  await page.goto('http://localhost:7847/checkout', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Take initial screenshot
  await page.screenshot({ path: 'scripts/checkout_initial.png', fullPage: false });
  console.log('Captured scripts/checkout_initial.png');

  // Verify elements
  const title = await page.textContent('h1');
  console.log('Page Title:', title);

  // Check initial total
  // Base 18.50 + Salchi 5.00 + Drink 4.50 = 28.00 - coupon 3.00 + delivery 4.00 = 29.00
  const initialTotalBtn = await page.locator('button:has-text("Confirmar y Pagar")').textContent();
  console.log('Button text initially:', initialTotalBtn?.trim());

  // 2. Toggle to Recojo en Tienda
  console.log('Toggling to Recojo en Tienda...');
  await page.click('button:has-text("Recojo en Tienda")');
  await page.waitForTimeout(500);
  const pickupTotalBtn = await page.locator('button:has-text("Confirmar y Pagar")').textContent();
  console.log('Button text after pickup (saved S/. 4 delivery):', pickupTotalBtn?.trim());

  // Switch back to Delivery
  await page.click('button:has-text("Delivery")');
  await page.waitForTimeout(500);

  // 3. Test Upsell: Click on "Tequeños de Pollo" (+S/. 12.00)
  console.log('Testing Upsell: Adding Tequeños de Pollo...');
  // Find upsell button for tequenos
  const addTequenosBtn = page.locator('button:has-text("Agregar")').first();
  await addTequenosBtn.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await addTequenosBtn.click();
  await page.waitForTimeout(500);

  const afterUpsellTotalBtn = await page.locator('button:has-text("Confirmar y Pagar")').textContent();
  console.log('Button text after adding Tequeños (+S/. 12.00):', afterUpsellTotalBtn?.trim());

  // Take screenshot with upsell added
  await page.screenshot({ path: 'scripts/checkout_upsell_added.png', fullPage: false });

  // 4. Test selecting payment method (e.g. Yape)
  console.log('Testing Payment Method Selection (Yape)...');
  const yapeBtn = page.locator('button:has-text("Yape")');
  await yapeBtn.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await yapeBtn.click();
  await page.waitForTimeout(500);

  // 5. Scroll down to inspect the bill breakdown and check clearance from sticky footer
  console.log('Inspecting bill breakdown at bottom of page...');
  const totalRow = page.locator('text=Total a Pagar');
  await totalRow.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'scripts/checkout_bill_breakdown.png', fullPage: false });
  console.log('Captured scripts/checkout_bill_breakdown.png');

  // 6. Click "Confirmar y Pagar"
  console.log('Clicking "Confirmar y Pagar"...');
  const confirmBtn = page.locator('button:has-text("Confirmar y Pagar")');
  await confirmBtn.click();
  
  // Wait for processing state
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'scripts/checkout_processing.png', fullPage: false });
  console.log('Captured scripts/checkout_processing.png');

  // Wait for confirmed state
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'scripts/checkout_confirmed.png', fullPage: false });
  console.log('Captured scripts/checkout_confirmed.png');

  await browser.close();
  console.log('--- All Playwright Checkout tests completed successfully! ---');
}

testCheckout().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
