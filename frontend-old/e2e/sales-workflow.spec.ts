import { expect, test } from '@playwright/test'
import { apiFixture } from './api-fixture'

test('manager AI analysis stays private and offer uses server calculation', async ({ page }) => {
  await apiFixture(page)
  let sharedMessagePosts = 0
  page.on('request', (request) => {
    if (request.method() === 'POST' && /\/chat\/sessions\/\d+\/messages$/.test(request.url())) {
      sharedMessagePosts++
    }
  })

  await page.goto('/ai')
  await page.getByLabel('Сделка').selectOption('5')
  await page.getByRole('button', { name: 'Сформировать сводку' }).click()
  await expect(page.getByText('Клиенту нужна двухкомнатная квартира и парковка.')).toBeVisible()
  expect(sharedMessagePosts).toBe(0)

  await page.goto('/offers')
  await page.getByLabel('Сделка').selectOption('5')
  await page.getByLabel('Скидка, %').fill('4')
  await page.getByRole('button', { name: 'Проверить расчёт' }).click()
  await expect(page.getByText('6 720 000 ₽')).toBeVisible()
  await expect(page.getByText('В пределах лимита')).toBeVisible()
})
