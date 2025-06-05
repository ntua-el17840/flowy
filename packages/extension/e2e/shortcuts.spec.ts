import { test, expect } from "@playwright/test"

test.describe("Shortcut Regression", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("chrome-extension://*/popup.html")
  })

  test("should not conflict with common browser shortcuts", async ({ page }) => {
    // Test common browser shortcuts that should still work
    const shortcuts = [
      "Control+T", // New tab
      "Control+W", // Close tab
      "Control+R", // Refresh
      "Control+L", // Focus address bar
      "Control+Shift+T", // Reopen closed tab
      "Control+Tab", // Next tab
      "Control+Shift+Tab", // Previous tab
      "Control+1", // First tab
      "Control+9", // Last tab
      "Control+F", // Find
      "Control+H", // History
      "Control+J", // Downloads
      "Control+K", // Search
      "Control+N", // New window
      "Control+Shift+N", // New incognito window
      "Control+Shift+B", // Show bookmarks
      "Control+Shift+O", // Bookmark manager
      "Control+Shift+E", // Extensions
      "Control+Shift+I", // Developer tools
      "Control+Shift+J", // Console
      "Control+Shift+C", // Inspect element
      "Control+Shift+M", // Device toolbar
      "Control+Shift+R", // Hard reload
      "Control+Shift+Delete", // Clear browsing data
      "Control+Shift+P", // Print
      "Control+Shift+S", // Save page
      "Control+Shift+D", // Bookmark all tabs
      "Control+Shift+W", // Close window
      "Control+Shift+Q", // Quit Chrome
      "Control+Shift+M" // Mute tab
    ]

    for (const shortcut of shortcuts) {
      // Verify the shortcut doesn't trigger our command palette
      await page.keyboard.press(shortcut)
      await expect(page.locator("[data-testid='command-palette']")).not.toBeVisible()
    }
  })

  test("should handle rapid shortcut combinations", async ({ page }) => {
    // Test rapid combinations of our shortcuts
    const combinations = [
      ["Control+Space", "Control+Alt+Space"],
      ["Control+Alt+Space", "Control+Space"],
      ["Control+Space", "Escape", "Control+Space"],
      ["Control+Alt+Space", "Escape", "Control+Alt+Space"]
    ]

    for (const combo of combinations) {
      for (const shortcut of combo) {
        await page.keyboard.press(shortcut)
        // Add a small delay between shortcuts
        await page.waitForTimeout(100)
      }
      // Verify the last shortcut worked correctly
      if (combo[combo.length - 1] === "Control+Space") {
        await expect(page.locator("[data-testid='web-search-palette']")).toBeVisible()
      } else if (combo[combo.length - 1] === "Control+Alt+Space") {
        await expect(page.locator("[data-testid='tool-search-palette']")).toBeVisible()
      }
    }
  })
}) 