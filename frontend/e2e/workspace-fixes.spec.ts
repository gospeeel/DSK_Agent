import { expect, test } from '@playwright/test'
import { apiFixture } from './api-fixture'
test('floor geometry is stable and uses API inventory', async ({ page }) => {
  await apiFixture(page)
  await page.goto('/construction/7')
  await page.getByRole('button', { name: 'На схеме' }).click()
  const plan = page.getByTestId('floor-plan')
  await expect(plan).toBeVisible()
  const layout = await plan.getAttribute('data-layout-id')
  await expect(plan.getByRole('button', { name: /Квартира № 101/ })).toBeVisible()
  await page.reload()
  await page.getByRole('button', { name: 'На схеме' }).click()
  await expect(plan).toHaveAttribute('data-layout-id', layout!)
})
test('staff AI never sends internal advice to the client chat', async ({ page }) => {
  await apiFixture(page)
  let calls = 0
  page.on('request', (r) => {
    if (r.url().endsWith('/ai/chat')) calls++
  })
  await page.goto('/ai')
  await expect(page.getByRole('heading', { name: 'Разбор переписки' })).toBeVisible()
  expect(calls).toBe(0)
  await page.goto('/offers')
  await expect(page.getByRole('heading', { name: 'Новое коммерческое предложение' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Реестр предложений' })).toBeVisible()
})
test('messages come from the API and send once', async ({ page }) => {
  await apiFixture(page)
  await page.goto('/conversations')
  await expect(page.getByText('Подберите квартиру')).toBeVisible()
  await page.getByLabel('Сообщение', { exact: true }).fill('Добрый день')
  const sent = page.waitForRequest((r) => r.method() === 'POST' && r.url().endsWith('/messages'))
  await page.getByRole('button', { name: 'Отправить сообщение', exact: true }).click()
  expect((await sent).postDataJSON()).toEqual({ content: 'Добрый день' })
})
