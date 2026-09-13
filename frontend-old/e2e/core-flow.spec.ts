import { expect, test } from '@playwright/test'
import { apiFixture } from './api-fixture'
test('cookie login, own clients and logout', async ({ page }) => {
  await apiFixture(page, 'manager', false)
  await page.goto('/clients')
  await expect(page).toHaveURL(/\/login$/)
  await page.getByLabel('Электронная почта').fill('test@example.test')
  await page.getByLabel('Пароль').fill('password')
  await page.getByRole('button', { name: 'Войти', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Тестовый сотрудник' })).toBeVisible()
  await page.goto('/clients')
  await expect(page.getByText('Свой клиент')).toBeVisible()
  await expect(page.getByText('Чужой клиент')).toHaveCount(0)
  await page.getByText('Свой клиент').click()
  await expect(page.getByRole('heading', { name: 'Свой клиент' })).toBeVisible()
  await page.getByRole('button', { name: 'Выйти из профиля' }).click()
  await expect(page).toHaveURL(/\/login$/)
})
test('supervisor sees department clients', async ({ page }) => {
  await apiFixture(page, 'supervisor')
  await page.goto('/clients')
  await expect(page.getByText('Клиент отдела')).toBeVisible()
})
test('client route guard and a real-shaped inquiry request', async ({ page }) => {
  await apiFixture(page, 'user')
  await page.goto('/clients')
  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole('link', { name: 'AI-помощник' })).toHaveCount(0)
  await page.goto('/ai')
  await expect(page).toHaveURL(/\/$/)
  await page.goto('/construction')
  await page.getByRole('button', { name: /№ 101 ·/ }).click()
  await page.getByLabel('Сообщение менеджеру').fill('Хочу посмотреть квартиру')
  const sent = page.waitForRequest(
    (r) => r.method() === 'POST' && r.url().endsWith('/chat/sessions'),
  )
  await page.getByRole('button', { name: 'Отправить обращение' }).click()
  expect((await sent).postDataJSON()).toEqual({
    id_apartment: 100,
    message: 'Хочу посмотреть квартиру',
  })
  await expect(page.getByRole('status')).toContainText('Обращение № 12 создано')
})
test('client reads construction notifications', async ({ page }) => {
  await apiFixture(page, 'user')
  await page.goto('/')
  await page.getByRole('button', { name: 'Уведомления' }).click()
  await expect(page.getByText('Изменение сроков строительства')).toBeVisible()
  const readRequest = page.waitForRequest(
    (request) => request.method() === 'PUT' && request.url().endsWith('/notifications/31/read'),
  )
  await page.getByRole('button', { name: 'Прочитано' }).click()
  await readRequest
})
test('errors are visible without fallback inventory', async ({ page }) => {
  await apiFixture(page)
  await page.route('**/staff-api/api/complexes', (route) =>
    route.fulfill({ status: 403, body: 'Доступ запрещён' }),
  )
  await page.goto('/construction')
  await expect(page.getByRole('alert')).toContainText('Доступ запрещён')
  await expect(page.getByRole('button', { name: 'Повторить' })).toBeVisible()
  await expect(page.getByText('Тестовый корпус')).toHaveCount(0)
})
