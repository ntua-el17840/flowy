import { test, expect } from '@playwright/test'

test('popup opens and renders correctly', async ({ page }) => {
  // Navigate to the popup page
  await page.goto('chrome-extension://[EXTENSION_ID]/popup.html')
  
  // Basic assertion that the page loaded
  await expect(page).toHaveTitle(/Flowy/)
}) 