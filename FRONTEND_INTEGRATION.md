# Интеграция frontend с DSK Agent

Актуально на 12 сентября 2026 года. Источник истины — маршруты `backend/cmd/*/main.go`, Go DTO и SQL migrations. Frontend обращается только к Go HTTP API; PostgreSQL, RabbitMQ и Agent Service напрямую ему недоступны.

## Контур

```text
Frontend → Go Backend → PostgreSQL
                    ↕
                 RabbitMQ ↔ Python Agent Service ↔ GigaChat
```

- User API: `http://localhost:8080`, frontend-префикс `/user-api/api`.
- Staff API: `http://localhost:8081`, frontend-префикс `/staff-api/api`.
- Agent health: `http://localhost:8000/health`.
- Swagger: `/swagger/`, OpenAPI JSON: `/swagger/doc.json`.
- Только staff-server обслуживает `backend.agent-rpc` и предоставляет AI-сценарии сотрудникам.

## Авторизация и роли

Backend устанавливает HttpOnly cookie `token`; frontend использует `credentials: include`, не хранит JWT в `localStorage` и очищает Pinia/Query-кэш при logout или 401.

| Роль | Возможности |
|---|---|
| `user` | Собственные обращения, сообщения, сделки, утверждённые КП/PDF и уведомления; публичный каталог. |
| `manager` | Свои сделки/клиенты/обращения и неназначенная очередь; создание каталожных и ERP-данных; КП и запрос согласования; свои напоминания. |
| `supervisor` | Данные отдела, изменение каталога, согласование КП, версии матрицы скидок, назначение напоминаний сотрудникам. |

AI-помощник — внутренний инструмент сотрудников. Клиентский интерфейс не показывает
пункт AI и перенаправляет клиента с `/ai` в его рабочее пространство.

Удаление каталожных сущностей через HTTP не зарегистрировано.

## User API

| Method | URL | Назначение |
|---|---|---|
| POST | `/api/auth/register`, `/api/auth/login`, `/api/auth/logout` | Регистрация клиента, вход, выход |
| GET/PUT | `/api/users/me` | Профиль клиента |
| POST/GET | `/api/chat/sessions`, `/api/chat/sessions/{id}`, `/messages` | Обращения и переписка |
| GET | `/api/deals`, `/api/deals/{id}` | Собственные сделки |
| GET | `/api/offers`, `/api/offers/{id}`, `/api/offers/{id}/pdf` | Собственные КП и утверждённый PDF |
| GET | `/api/notifications` | Уведомления; `?unread=true` — непрочитанные |
| PUT | `/api/notifications/{id}/read`, `/api/notifications/read-all` | Прочтение уведомлений |
| GET | `/api/complexes*`, `/api/buildings*`, `/api/apartments/{id}`, `/api/progress/{id}` | Публичный строительный каталог |
| GET | `/api/buildings/{buildingId}/ancillary-units` | Парковки и кладовые |

OpenAPI содержит 28 user API methods, не считая два Swagger route.

## Staff API

Помимо входа, профилей, каталога, чатов и сделок staff-server предоставляет:

| Method | URL | Роль/назначение |
|---|---|---|
| POST | `/api/ai/chat` | Внутренний AI-диалог сотрудника; клиентский API этот маршрут не предоставляет |
| GET/POST | `/api/offers` | Реестр и новая версия КП |
| POST | `/api/offers/calculate` | Авторитетный расчёт цены и допустимой скидки |
| POST | `/api/offers/{id}/approval-request` | Запрос согласования |
| POST | `/api/offers/{id}/approve`, `/reject` | Только supervisor |
| GET | `/api/offers/{id}/pdf` | Полноценное русскоязычное PDF-КП только для согласованной версии; документ сохраняется |
| POST | `/api/offers/{id}/send` | SMTP-отправка PDF-вложения и запись `sent/failed` |
| POST | `/api/ai/dialog/analyze` | Приватное извлечение фактов и возражений |
| POST | `/api/ai/dialog/reply-assist` | Приватный черновик ответа; автоматически клиенту не отправляется |
| GET/POST | `/api/competitors` | Наблюдения конкурентов; создание — supervisor |
| PUT | `/api/competitors/{id}` | Supervisor обновляет наблюдение |
| GET | `/api/buildings/{buildingId}/discount-policies` | История матрицы скидок |
| POST | `/api/discount-policies` | Supervisor создаёт новую версию |
| GET/POST | `/api/buildings/{buildingId}/ancillary-units`, `/api/ancillary-units` | Парковки/кладовые; создавать может staff |
| PUT | `/api/ancillary-units/{id}` | Только supervisor |
| GET | `/api/buildings/{buildingId}/erp` | ERP-сводка объекта |
| POST | `/api/erp/events`, `/material-stocks`, `/production-schedules` | Ввод имитационных ERP-данных |
| GET/POST | `/api/reminders` | Напоминания сотрудника; supervisor видит отдел |
| PUT | `/api/reminders/{id}/complete` | Завершение своего напоминания или supervisor |

OpenAPI содержит 60 staff API methods, не считая два Swagger route.

## Ключевые DTO

Все ID — JSON integer, даты — RFC 3339. Обычные ответы возвращаются напрямую, без общего envelope.

Создание сделки:

```json
{
  "id_user": 10,
  "id_apartment": 42,
  "id_chat_session": 1,
  "percent_discount": 3
}
```

`id_employee`, `base_price` и `total_price` не принимаются от frontend: сотрудник берётся из JWT, цена — из квартиры, итог считает backend. Лимит скидки сначала ищется в действующей версии `discount_policies` для корпуса и роли; при отсутствии используется env-конфигурация.

Расчёт КП:

```json
{
  "deal_id": 7,
  "discount_percent": "4.5",
  "parking_unit_id": 41,
  "storage_unit_id": 42
}
```

Дополнительные ID необязательны. Backend принимает только свободные позиции нужного типа из того же корпуса, что и квартира. Ответ содержит `apartment_price`, снимки цен парковки/кладовой, общую `base_price`, `discount_amount`, `final_price`, `max_allowed_discount`, `requires_approval`. Скидка применяется к общей базе; frontend формулу локально не повторяет.

Создание версии КП:

```json
{
  "request_id": "uuid-or-idempotency-key",
  "deal_id": 7,
  "discount_percent": "4.5",
  "generated_text": "Текст предложения",
  "parking_unit_id": 41,
  "storage_unit_id": 42
}
```

AI workflow использует `request_id` RabbitMQ как идемпотентный ключ. Скидка выше лимита создаёт `draft`, затем менеджер вызывает `approval-request`; руководитель принимает или отклоняет с причиной.

Приватный анализ:

```json
{ "deal_id": 7 }
```

Reply Assist дополнительно принимает `selected_text`. Результат не сохраняется как клиентское сообщение. Все AI-вызовы записываются в `ai_audit_log` со статусом `success/failed`.

Конкурент содержит `project_name`, `district`, `price_per_sqm`, `rooms`, `area`, преимущества/недостатки, `source_url`, `observed_at`, `updated_at`. Неподтверждённые преимущества AI придумывать не должен.

ERP snapshot:

```json
{
  "events": [],
  "material_stocks": [],
  "production_schedules": []
}
```

`construction.events.get` объединяет риски этапов, ERP-события, дефицитные материалы и задержанные производственные задачи. Analytics prompt выставляет `exact_delivery_date_allowed=true` только если плановая дата присутствует и нет задержек/рисков выше low.

## Ошибки и повтор запросов

- 400 — невалидный DTO;
- 401 — отсутствующая/истёкшая сессия;
- 403 — роль или ownership;
- 404 — сущность не найдена;
- 409 — конфликт состояния, занятая квартира, недопустимый этап КП;
- 422 — недостаточно данных для AI-анализа;
- 503/504 — недоступность или тайм-аут AI/SMTP.

GET можно повторять стандартной политикой TanStack Query. Мутации и AI POST автоматически не повторяются. Перед ручным повтором отправки проверяется реестр/статус; создание КП идемпотентно по `request_id`.

## PostgreSQL additions

Миграция `000008_sales_workflow.sql` добавляет:

- `discount_policies`;
- `ancillary_units`;
- `offer_documents`, `offer_deliveries` и поля отклонения/дополнительных позиций в `offers`;
- источники и актуальность в `competitors`;
- `erp_events`, `material_stocks`, `production_schedules`;
- `ai_audit_log`, `staff_reminders`.

Миграция `000009_offer_ancillary_price_snapshot.sql` сохраняет цены выбранных парковки и кладовой непосредственно в версии КП. Поэтому повторная выгрузка PDF не меняется после обновления каталожных цен.

PDF формируется сервером на основании сохранённой версии КП и связанных данных сделки. В документ входят клиент и менеджер, ЖК и корпус, характеристики квартиры, детерминированная векторная схема её функционального зонирования, парковка/кладовая, состав цены, скидка, итог и персональные условия. Кириллица обеспечивается встроенным Unicode-шрифтом. Если у корпуса есть сдвиг срока, PDF не публикует неподтверждённую точную дату и ссылается на условия ДДУ. Пока backend не хранит исходный архитектурный чертёж, схема явно помечена как немасштабная; её можно будет заменить реальным планом без изменения API скачивания.

Связи остаются one-to-many. Отдельных many-to-many таблиц не добавлено.

## Запуск и production

Frontend proxy должен направлять `/user-api/api/*` в user-server и `/staff-api/api/*` в staff-server, сохраняя `Set-Cookie`. Для production необходимы HTTPS, согласованные `Secure`/`SameSite`/CSRF, PostgreSQL migrations, RabbitMQ, Agent Service/GigaChat и SMTP.

Фактические остатки и критерии приёмки находятся в [FRONTEND_MIGRATION_STATUS.md](./FRONTEND_MIGRATION_STATUS.md).
