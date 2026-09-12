import type { Page } from '@playwright/test'
export async function apiFixture(
  page: Page,
  role: 'user' | 'manager' | 'supervisor' = 'manager',
  authenticated = true,
) {
  const user = { id: 2, name: 'Тестовый сотрудник', email: 'test@example.test', role }
  const building = {
    id: 7,
    residential_complex_id: 1,
    address: 'Тестовый корпус',
    district: 'Центральный',
    floors_count: 12,
    planned_date: '2027-01-01T00:00:00Z',
    actual_date: null,
    status: 'construction',
    type_wall_material: 'panel',
    latitude: 0,
    longitude: 0,
  }
  await page.route(/\/(user|staff)-api\/api\//, async (route) => {
    const request = route.request()
    const path = new URL(request.url()).pathname.replace(/^\/(user|staff)-api\/api/, '')
    const json = (body: unknown, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })
    if (path === '/auth/login') {
      authenticated = true
      return json({ user })
    }
    if (path === '/auth/logout') {
      authenticated = false
      return json({ message: 'logged out' })
    }
    if (!authenticated) return route.fulfill({ status: 401, body: 'unauthorized' })
    if (path === '/auth/profile' || path === '/staff/profile') return json(user)
    if (path === '/users/me')
      return json(
        request.method() === 'PUT' ? { user: { ...user, ...request.postDataJSON() } } : user,
      )
    if (path === '/notifications')
      return json([
        {
          id: 31,
          user_id: 2,
          deal_id: 5,
          type: 'construction_delay',
          title: 'Изменение сроков строительства',
          message: 'На этапе отделки зафиксирована задержка.',
          is_read: false,
          created_at: '2026-09-11T12:00:00Z',
          read_at: null,
        },
      ])
    if (path === '/notifications/31/read' || path === '/notifications/read-all')
      return json({ success: true })
    if (path === '/users/3')
      return json({ id: 3, name: 'Свой клиент', email: 'own@example.test', role: 'user' })
    if (path === '/users')
      return json([
        { id: 3, name: 'Свой клиент', email: 'own@example.test', role: 'user' },
        { id: 4, name: 'Клиент отдела', email: 'team@example.test', role: 'user' },
      ])
    if (path === '/chat/sessions' && request.method() === 'POST') return json({ id: 12 })
    if (path === '/chat/sessions')
      return json([
        {
          id: 11,
          id_user: role === 'user' ? 2 : 3,
          id_employee: 2,
          status: 'in_progress',
          user_name: 'Свой клиент',
          created_at: '2026-09-10T09:00:00Z',
        },
        {
          id: 99,
          id_user: 4,
          id_employee: 8,
          status: 'in_progress',
          user_name: 'Чужой клиент',
          created_at: '2026-09-10T09:00:00Z',
        },
      ])
    if (path === '/chat/sessions/11/messages')
      return json(
        request.method() === 'POST'
          ? { id: 9 }
          : [
              {
                id: 1,
                id_chat_session: 11,
                id_user: 3,
                sender_type: 'client',
                content: 'Подберите квартиру',
                sended_at: '2026-09-10T09:00:00Z',
                is_read: true,
              },
            ],
      )
    if (path === '/deals')
      return json([
        {
          id: 5,
          id_user: 3,
          id_employee: 2,
          id_apartment: 100,
          id_chat_session: 11,
          base_price: 7_000_000,
          percent_discount: 0,
          total_price: 7_000_000,
          status: 'pending',
          user_name: 'Свой клиент',
        },
      ])
    if (path === '/offers') return json([])
    if (path === '/offers/calculate')
      return json({
        deal_id: 5,
        base_price: 7_000_000,
        discount_percent: '4',
        discount_amount: 280_000,
        final_price: 6_720_000,
        max_allowed_discount: '5',
        requires_approval: false,
      })
    if (path === '/buildings/7/progress') return json([])
    if (path === '/complexes')
      return json([{ id: 1, name: 'Тестовый ЖК', address: 'Тестовый адрес', description: '' }])
    if (path === '/complexes/1/buildings') return json([building])
    if (path === '/buildings/7') return json(building)
    if (path === '/buildings/7/apartments')
      return json(
        [2, 1, 2, 3, 1, 3].map((rooms, i) => ({
          id: 100 + i,
          building_id: 7,
          number: String(101 + i),
          rooms,
          floor: 10,
          area: 50 + i,
          price: 7_000_000,
          status: i === 5 ? 'sold' : 'free',
          type_finishing: 'rough',
        })),
      )
    if (path === '/buildings/7/ancillary-units') return json([])
    if (path === '/buildings/7/erp')
      return json({ events: [], material_stocks: [], production_schedules: [] })
    if (path === '/reminders') return json([])
    if (path === '/ai/chat')
      return json({ message: 'Ответ по обращению', agent: 'general', intent: 'general' })
    if (path === '/ai/dialog/analyze')
      return json({
        deal_id: 5,
        client_id: 3,
        preferences_updated: true,
        analysis: {
          budget_min: null,
          budget_max: 7_000_000,
          rooms: 2,
          floor_min: null,
          floor_max: null,
          parking_required: true,
          renovation_required: null,
          preferred_district: null,
          purchase_timeline: null,
          important_factors: ['парковка'],
          objections: ['срок сдачи'],
          summary: 'Клиенту нужна двухкомнатная квартира и парковка.',
        },
      })
    if (path === '/ai/dialog/reply-assist')
      return json({
        deal_id: 5,
        source: 'last_client_message',
        analysis: { intent: 'timing_objection', summary: 'Клиент уточняет срок сдачи.' },
        suggested_reply: 'Проверю актуальный статус строительства и вернусь с подтверждёнными данными.',
      })
    if (path === '/competitors') return json([])
    return route.fulfill({ status: 404, body: `Unexpected test request ${path}` })
  })
}
