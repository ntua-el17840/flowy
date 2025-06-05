import { test, expect } from "@playwright/test"

test.describe("Web Search", () => {
  test.beforeEach(async ({ page }) => {
    // Load the extension popup
    await page.goto("chrome-extension://*/popup.html")
  })

  test("should show search suggestions", async ({ page }) => {
    // Mock the search suggestions API
    await page.route("**/complete/search*", async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify(["test suggestion 1", "test suggestion 2"])
      })
    })

    // Open web search palette (Ctrl + Space)
    await page.keyboard.press("Control+Space")
    
    // Type in the search box
    await page.keyboard.type("test")
    
    // Wait for suggestions to appear
    await expect(page.locator("[data-testid='suggestion-item']")).toHaveCount(2)
  })

  test("should navigate suggestions with arrow keys", async ({ page }) => {
    // Mock the search suggestions API
    await page.route("**/complete/search*", async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify(["test suggestion 1", "test suggestion 2"])
      })
    })

    // Open web search palette
    await page.keyboard.press("Control+Space")
    await page.keyboard.type("test")

    // Navigate through suggestions
    await page.keyboard.press("ArrowDown")
    await expect(page.locator("[data-testid='suggestion-item'].active")).toHaveText("test suggestion 1")
    
    await page.keyboard.press("ArrowDown")
    await expect(page.locator("[data-testid='suggestion-item'].active")).toHaveText("test suggestion 2")
    
    await page.keyboard.press("ArrowUp")
    await expect(page.locator("[data-testid='suggestion-item'].active")).toHaveText("test suggestion 1")
  })

  test("should open search in new tab", async ({ page, context }) => {
    // Mock the search suggestions API
    await page.route("**/complete/search*", async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify(["test suggestion"])
      })
    })

    // Open web search palette
    await page.keyboard.press("Control+Space")
    await page.keyboard.type("test")
    await page.keyboard.press("ArrowDown")
    
    // Press Enter to open search
    const [newPage] = await Promise.all([
      context.waitForEvent("page"),
      page.keyboard.press("Enter")
    ])
    
    // Verify new tab opened with correct URL
    await expect(newPage).toHaveURL(/.*q=test\+suggestion/)
  })
}) 