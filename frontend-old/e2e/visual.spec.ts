import { expect, test } from '@playwright/test'
import { apiFixture } from './api-fixture'
for (const width of [1440, 390]) {
  test('catalog fits viewport ' + width, async ({ page }, testInfo) => {
    await apiFixture(page)
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/construction/7')
    await expect(page.getByRole('heading', { name: 'Тестовый корпус' })).toBeVisible()
    await page.getByRole('button', { name: 'На схеме' }).click()
    await expect(page.getByTestId('floor-plan')).toBeVisible()
    const layout = await page.evaluate(() => ({
      viewport: innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      overflowing: [...document.querySelectorAll<HTMLElement>('body *')]
        .filter((element) => element.getBoundingClientRect().right > innerWidth + 1)
        .slice(0, 5)
        .map((element) => ({ tag: element.tagName, className: element.className })),
    }))
    expect(layout.scrollWidth, JSON.stringify(layout)).toBeLessThanOrEqual(layout.viewport)
    await page.screenshot({ path: testInfo.outputPath('catalog.png'), fullPage: true })
  })

  test('notification center fits viewport ' + width, async ({ page }, testInfo) => {
    await apiFixture(page, 'user')
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/')
    await page.getByRole('button', { name: 'Уведомления' }).click()
    await expect(page.getByRole('heading', { name: 'Уведомления' })).toBeVisible()
    await page.waitForTimeout(250)
    const layout = await page.evaluate(() => ({
      viewport: innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      overflowing: [...document.querySelectorAll<HTMLElement>('body *')]
        .filter((element) => element.getBoundingClientRect().right > innerWidth + 1)
        .slice(0, 5)
        .map((element) => ({ tag: element.tagName, className: element.className })),
    }))
    expect(layout.scrollWidth, JSON.stringify(layout)).toBeLessThanOrEqual(layout.viewport)
    await page.screenshot({ path: testInfo.outputPath('notifications.png'), fullPage: true })
  })
}

for (const width of [1440, 390]) {
  test(`new sales surfaces fit viewport ${width}`, async ({ page }, testInfo) => {
    await apiFixture(page)
    await page.setViewportSize({ width, height: 900 })
    for (const route of ['/ai', '/offers', '/construction/7']) {
      await page.goto(route)
      await page.waitForLoadState('networkidle')
      const layout = await page.evaluate(() => ({
        viewport: innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
      }))
      expect(layout.scrollWidth, `${route}: ${JSON.stringify(layout)}`).toBeLessThanOrEqual(
        layout.viewport,
      )
      await page.screenshot({
        path: testInfo.outputPath(`${route.replaceAll('/', '-') || 'home'}-${width}.png`),
        fullPage: true,
      })
    }
  })
}
