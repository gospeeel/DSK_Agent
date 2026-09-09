# Интеграция Frontend с DSK_Agent

Этот документ описывает фактическое состояние Go Backend и интеграцию с Python Agent Service. Источник истины — зарегистрированные маршруты в `backend/cmd/*/main.go`, Go DTO, handlers и SQL migrations. Runtime Swagger синхронизирован с зарегистрированными маршрутами и фактическими Go DTO.

## 1. Архитектура

Обычные запросы:

```text
Frontend → HTTP Go Backend → PostgreSQL
```

AI-запросы:

```text
Frontend
  → POST /api/ai/chat в Go Backend
  → RabbitMQ exchange app.topic, routing key agent.chat.request
  → Python Agent Service
  → GigaChat
  → при необходимости backend.* RPC через RabbitMQ
  → RabbitMQ RPC response
  → Go Backend
  → HTTP response Frontend
```

Frontend работает только с HTTP API Go Backend. Frontend не должен напрямую обращаться к PostgreSQL, RabbitMQ или Agent Service.

В проекте два HTTP-сервера:

- `user-server` — клиентский API и публичный каталог объектов;
- `staff-server` — API менеджеров и супервайзеров, административный CRUD и AI Assistant.

Только `staff-server` запускает consumer очереди `backend.agent-rpc`. Поэтому для AI-сценариев, использующих фактические данные Backend, `staff-server` должен быть запущен даже тогда, когда исходный HTTP-запрос отправляется в `user-server`.

## 2. Локальные адреса

| Сервис | URL |
|---|---|
| User API | `http://localhost:8080` |
| Staff API | `http://localhost:8081` |
| User Swagger UI | `http://localhost:8080/swagger/` или `/swagger/index.html` |
| Staff Swagger UI | `http://localhost:8081/swagger/` или `/swagger/index.html` |
| User OpenAPI JSON | `http://localhost:8080/swagger/doc.json` |
| Staff OpenAPI JSON | `http://localhost:8081/swagger/doc.json` |
| Agent Service health | `http://localhost:8000/health` |
| RabbitMQ Management UI | `http://localhost:15672` |

`GET /swagger` на обоих Go-серверах перенаправляет на `/swagger/`.

## 3. Авторизация

### Механизм

После успешного login Backend:

1. возвращает JWT в JSON-поле `token`;
2. одновременно устанавливает HttpOnly cookie `token` на 24 часа;
3. принимает JWT либо из заголовка `Authorization: Bearer <token>`, либо из cookie;
4. если переданы оба варианта, сначала используется заголовок `Authorization`.

Локальная cookie имеет `HttpOnly`, `SameSite=Lax`, `Secure=false`. Logout удаляет cookie, но серверного blacklist JWT нет.

Для frontend наиболее явно использовать Bearer JWT. Для cookie-запросов нужен `credentials: "include"`.

### Роли

| Значение в Backend | Значение для UI | Доступ |
|---|---|---|
| `user` | client | Клиентские authenticated routes на `user-server` |
| `manager` | manager | Все защищённые staff routes; Offer только по сделке, где `deals.id_employee` равен ID менеджера |
| `supervisor` | supervisor | Все защищённые staff routes; Offer по любой сделке |

В БД и JWT клиентская роль называется именно `user`, а не `client`.

Технически защищённая группа `user-server` проверяет наличие валидного JWT, но не делает отдельную проверку `role=user`. Защищённая группа `staff-server` явно допускает только `manager` и `supervisor`.

### Auth DTO

Регистрация клиента — `POST http://localhost:8080/api/auth/register`:

```json
{
  "name": "Иван Иванов",
  "email": "ivan@example.com",
  "password": "user-password"
}
```

Успех: HTTP 201 и объект пользователя:

```json
{
  "id": 10,
  "name": "Иван Иванов",
  "email": "ivan@example.com",
  "role": "user"
}
```

Регистрация сотрудника — `POST http://localhost:8081/api/auth/register`:

```json
{
  "name": "Менеджер",
  "email": "manager@example.com",
  "password": "staff-password",
  "role": "manager"
}
```

`role` может быть `manager` или `supervisor`; если поле отсутствует, handler создаёт `manager`.

Login на соответствующем сервере — `POST /api/auth/login`:

```json
{
  "email": "manager@example.com",
  "password": "staff-password"
}
```

Успех:

```json
{
  "token": "<jwt>",
  "user": {
    "id": 2,
    "name": "Менеджер",
    "email": "manager@example.com",
    "role": "manager"
  }
}
```

`staff-server` после проверки пароля дополнительно отклоняет роль `user` с HTTP 403.

## 4. Полный список HTTP routes

В таблицах `Public` означает отсутствие обязательного AuthMiddleware. `Optional` означает, что middleware пытается прочитать JWT, но разрешает продолжить без него. Оба HTTP endpoint `/api/ai/chat` находятся под обязательным AuthMiddleware.

### User server — порт 8080

| Method | URL | Auth | Role | Назначение |
|---|---|---|---|---|
| GET | `/swagger` | Public | — | Redirect на Swagger UI |
| GET | `/swagger/*` | Public | — | Swagger UI, `index.html`, `doc.json` |
| POST | `/api/auth/register` | Public | — | Регистрация клиента с ролью `user` |
| POST | `/api/auth/login` | Public | — | Login пользователя |
| POST | `/api/auth/logout` | Public | — | Удаление cookie `token` |
| POST | `/api/ai/chat` | Required | Валидный JWT | AI chat; JWT identity становится trusted `user_id` для Agent Service |
| POST | `/api/chat/sessions` | Optional | Guest или JWT | Создание обращения/чат-сессии |
| GET | `/api/complexes` | Public | — | Список ЖК |
| GET | `/api/complexes/{id}` | Public | — | Один ЖК |
| GET | `/api/complexes/{complexId}/buildings` | Public | — | Корпуса ЖК |
| GET | `/api/buildings/{id}` | Public | — | Один корпус |
| GET | `/api/buildings/{buildingId}/apartments` | Public | — | Квартиры корпуса |
| GET | `/api/buildings/{buildingId}/progress` | Public | — | Ход строительства корпуса |
| GET | `/api/apartments/{id}` | Public | — | Одна квартира |
| GET | `/api/progress/{id}` | Public | — | Один этап строительства |
| GET | `/api/auth/profile` | Required | Любой валидный JWT | Профиль из JWT claims |
| GET | `/api/users/me` | Required | Любой валидный JWT | Актуальный пользователь из БД |
| PUT | `/api/users/me` | Required | Любой валидный JWT | Изменение собственного профиля |
| GET | `/api/chat/sessions` | Required | Обычно `user` | Сессии текущего пользователя |
| GET | `/api/chat/sessions/{id}` | Required | Любой валидный JWT | Одна сессия |
| GET | `/api/chat/sessions/{id}/messages` | Required | Любой валидный JWT | Сообщения сессии |
| POST | `/api/chat/sessions/{id}/messages` | Required | Любой валидный JWT | Отправить сообщение |
| GET | `/api/deals` | Required | Обычно `user` | Сделки текущего пользователя |
| GET | `/api/deals/{id}` | Required | Любой валидный JWT | Одна сделка |

Итого: 24 зарегистрированных route, включая 2 Swagger route; 22 API route.

### Staff server — порт 8081

| Method | URL | Auth | Role | Назначение |
|---|---|---|---|---|
| GET | `/swagger` | Public | — | Redirect на Swagger UI |
| GET | `/swagger/*` | Public | — | Swagger UI, `index.html`, `doc.json` |
| POST | `/api/auth/register` | Public | — | Создание manager/supervisor |
| POST | `/api/auth/login` | Public | — | Login сотрудника |
| POST | `/api/auth/logout` | Public | — | Удаление cookie `token` |
| GET | `/api/staff/profile` | Required | manager, supervisor | Профиль из JWT claims |
| GET | `/api/users` | Required | manager, supervisor | Все пользователи |
| GET | `/api/users/{id}` | Required | manager, supervisor | Пользователь по ID |
| GET | `/api/chat/sessions` | Required | manager, supervisor | Все сессии; фильтры `status`, `employee_id` |
| GET | `/api/chat/sessions/{id}` | Required | manager, supervisor | Одна сессия |
| POST | `/api/chat/sessions/{id}/take` | Required | manager, supervisor | Назначить текущего сотрудника, статус `in_progress` |
| POST | `/api/chat/sessions/{id}/close` | Required | manager, supervisor | Закрыть сессию |
| POST | `/api/chat/sessions/{id}/reject` | Required | manager, supervisor | Сохранить причину отказа |
| GET | `/api/chat/sessions/{id}/messages` | Required | manager, supervisor | Сообщения сессии |
| POST | `/api/chat/sessions/{id}/messages` | Required | manager, supervisor | Сообщение менеджера |
| POST | `/api/deals` | Required | manager, supervisor | Создать сделку; `id_employee` берётся из JWT identity |
| GET | `/api/deals` | Required | manager, supervisor | Все сделки; фильтры `status`, `user_id` |
| GET | `/api/deals/{id}` | Required | manager, supervisor | Одна сделка |
| PUT | `/api/deals/{id}/status` | Required | manager, supervisor | Изменить статус и опционально скидку сделки |
| POST | `/api/ai/chat` | Required | manager, supervisor | AI Assistant |
| POST | `/api/complexes` | Required | manager, supervisor | Создать ЖК |
| GET | `/api/complexes` | Required | manager, supervisor | Список ЖК |
| GET | `/api/complexes/{id}` | Required | manager, supervisor | Один ЖК |
| PUT | `/api/complexes/{id}` | Required | manager, supervisor | Полностью обновить ЖК |
| DELETE | `/api/complexes/{id}` | Required | manager, supervisor | Удалить ЖК |
| GET | `/api/complexes/{complexId}/buildings` | Required | manager, supervisor | Корпуса ЖК |
| POST | `/api/buildings` | Required | manager, supervisor | Создать корпус |
| GET | `/api/buildings/{id}` | Required | manager, supervisor | Один корпус |
| PUT | `/api/buildings/{id}` | Required | manager, supervisor | Полностью обновить корпус |
| DELETE | `/api/buildings/{id}` | Required | manager, supervisor | Удалить корпус |
| GET | `/api/buildings/{buildingId}/apartments` | Required | manager, supervisor | Квартиры корпуса |
| GET | `/api/buildings/{buildingId}/progress` | Required | manager, supervisor | Ход строительства корпуса |
| POST | `/api/apartments` | Required | manager, supervisor | Создать квартиру |
| GET | `/api/apartments/{id}` | Required | manager, supervisor | Одна квартира |
| PUT | `/api/apartments/{id}` | Required | manager, supervisor | Полностью обновить квартиру |
| DELETE | `/api/apartments/{id}` | Required | manager, supervisor | Удалить квартиру |
| POST | `/api/progress` | Required | manager, supervisor | Создать этап строительства |
| GET | `/api/progress/{id}` | Required | manager, supervisor | Один этап |
| PUT | `/api/progress/{id}` | Required | manager, supervisor | Полностью обновить этап |
| DELETE | `/api/progress/{id}` | Required | manager, supervisor | Удалить этап |

Итого: 40 зарегистрированных route, включая 2 Swagger route; 38 API route.

## 5. Основные HTTP DTO

Все бизнесовые ID — JSON integer. Даты Go сериализует в RFC 3339. HTTP API обычно возвращает объект напрямую, без общего `{success,data,error}` envelope.

### POST /api/chat/sessions

Создаёт чат-сессию. Для authenticated пользователя `id_user` берётся из JWT. Guest обязан передать хотя бы `guest_email` или `guest_phone`.

```json
{
  "id_apartment": 42,
  "guest_name": "Иван",
  "guest_email": "ivan@example.com",
  "guest_phone": "+79990000000",
  "message": "Интересует квартира"
}
```

HTTP 201:

```json
{
  "id": 1,
  "id_user": 10,
  "id_employee": null,
  "id_apartment": 42,
  "status": "open",
  "created_at": "2026-09-10T10:00:00Z",
  "updated_at": "2026-09-10T10:00:00Z"
}
```

### GET /api/chat/sessions

На user-server возвращает сессии текущего пользователя. На staff-server возвращает все сессии и принимает query-параметры:

- `status=open|in_progress|close`;
- `employee_id=<integer>`.

Ответ — JSON-массив `ChatSession[]`; пустой результат — `[]`.

### POST /api/chat/sessions/{id}/messages

```json
{
  "content": "Текст сообщения"
}
```

HTTP 201:

```json
{
  "id": 15,
  "id_chat_session": 1,
  "id_user": 2,
  "sender_type": "manager",
  "content": "Текст сообщения",
  "is_read": false,
  "sended_at": "2026-09-10T10:05:00Z"
}
```

Возможные `sender_type`, которые используются кодом/Swagger: `client`, `manager`, `ai`, `system`. AI-ответ сохраняется с `id_user=null` и `sender_type=ai`.

### POST /api/deals — только staff-server

```json
{
  "id_user": 10,
  "id_apartment": 42,
  "id_chat_session": 1,
  "base_price": 14200000,
  "percent_discount": 3
}
```

`id_chat_session` опционален. `id_employee` нельзя задавать request-полем: Backend берёт его из authenticated сотрудника.

HTTP 201 возвращает `Deal`:

```json
{
  "id": 7,
  "id_user": 10,
  "id_employee": 2,
  "id_apartment": 42,
  "id_chat_session": 1,
  "base_price": 14200000,
  "percent_discount": 3,
  "total_price": 13774000,
  "status": "pending",
  "created_at": "2026-09-10T10:00:00Z",
  "updated_at": "2026-09-10T10:00:00Z"
}
```

### PUT /api/deals/{id}/status — только staff-server

```json
{
  "status": "contract",
  "percent_discount": 5
}
```

`percent_discount` опционален. Если он передан, Backend пересчитывает `total_price`.

### Construction DTO

`ResidentialComplex`:

```json
{
  "id": 1,
  "name": "ЖК Альфа",
  "address": "Адрес",
  "description": "Описание"
}
```

`Building`:

```json
{
  "id": 1,
  "residential_complex_id": 1,
  "address": "Адрес корпуса",
  "district": "Центральный",
  "latitude": 55.75,
  "longitude": 37.61,
  "floors_count": 20,
  "planned_date": "2027-03-08T00:00:00Z",
  "actual_date": null,
  "status": "construction",
  "type_wall_material": "monolith"
}
```

`Apartment`:

```json
{
  "id": 42,
  "building_id": 1,
  "number": "142",
  "rooms": 2,
  "floor": 8,
  "area": 64.5,
  "price": 14200000,
  "type_finishing": "turnkey",
  "status": "free"
}
```

`ConstructionProgress`:

```json
{
  "id": 3,
  "building_id": 1,
  "stage_name": "frame",
  "planned_start_date": "2026-01-01T00:00:00Z",
  "actual_start_date": "2026-01-05T00:00:00Z",
  "planned_end_date": "2026-08-01T00:00:00Z",
  "actual_end_date": null,
  "status": "delayed",
  "completion_percentage": 70,
  "delay_reason": "Задержка поставки материалов",
  "risk_level": "high",
  "delay_days": 25
}
```

POST/PUT construction routes принимают соответствующий объект без необходимости задавать `id`; для PUT ID берётся из path. Обязательные поля дополнительно проверяются handlers.

## 6. POST /api/ai/chat

### Доступ

- Staff API: только authenticated `manager` или `supervisor`.
- User API: обязательный AuthMiddleware; без валидного JWT запрос не доходит до handler и возвращает HTTP 401.

Request:

```json
{
  "message": "Проанализируй риски по строительству для этой сделки",
  "session_id": 1,
  "deal_id": 7
}
```

Правила DTO:

- `message` — непустая после trim строка;
- `session_id` — обязательный положительный integer, несмотря на `omitempty` в Go DTO;
- `deal_id` — положительный integer или `null`/отсутствующее поле;
- `user_id`, `created_by`, `requested_by`, цена и скидочные лимиты frontend не передаёт.

General Chat может передавать `deal_id: null`:

```json
{
  "message": "Привет! Чем ты можешь помочь?",
  "session_id": 1,
  "deal_id": null
}
```

Успешный HTTP 200 response:

```json
{
  "message": "Ответ AI-помощника",
  "agent": "general",
  "intent": "general_chat"
}
```

Возможные `agent`: `analytics`, `negotiation`, `offer`, `general`.

Возможные `intent`: `analyze_risk`, `analyze_construction`, `extract_client_facts`, `handle_objection`, `compare_competitor`, `create_offer`, `calculate_offer`, `offer_status`, `general_chat`, `unknown`.

Frontend не выбирает `agent` или `intent`: Agent Router определяет их по свободному тексту. Go Backend добавляет доверенный `user_id` из JWT, создаёт transport `request_id` и `correlation_id`, публикует RabbitMQ RPC и ожидает ответ до 75 секунд. Сообщение пользователя и успешный AI-ответ записываются в указанную chat session.

## 7. Реальные AI-возможности и доступность для frontend

| Сценарий | Как запускается | Доступность frontend |
|---|---|---|
| General Chat | `POST /api/ai/chat`, обычный вопрос, `deal_id` может быть `null` | Доступен |
| Negotiation | `POST /api/ai/chat` с возражением/сравнением и `deal_id` | Доступен; Agent использует factual deal/apartment/building/competitor context |
| Construction Analytics | `POST /api/ai/chat` с запросом анализа рисков/строительства и `deal_id` | Доступен |
| Client facts extraction в свободном чате | `POST /api/ai/chat` с соответствующим запросом и `deal_id` | Доступен через Analytics route |
| Offer create/calculate | `POST /api/ai/chat` с просьбой создать/рассчитать КП и `deal_id` | Доступен |
| Dialog Analyze | RabbitMQ RPC `agent.dialog.analyze` | Реализован в Agent Service, но HTTP endpoint в Go Backend отсутствует; frontend сейчас запустить не может |
| Reply Assist | RabbitMQ RPC `agent.dialog.reply_assist` | Реализован в Agent Service, но HTTP endpoint в Go Backend отсутствует; frontend сейчас запустить не может |
| Construction Delay Event | RabbitMQ event `event.construction.delay_detected` | Event-driven workflow; HTTP endpoint/producer для frontend отсутствует |

Offer approval continuation также слушает backend events `event.offer.approved` и `event.offer.rejected`; frontend HTTP routes для публикации этих событий в текущем коде нет.

Intent `offer_status` существует в Router schema, но специализированная обработка chat consumer реализована только для `create_offer` и `calculate_offer`. Не строить отдельный UI offer-status поверх этого intent без backend endpoint.

## 8. Offer: бизнес-правила

Offer создаётся только через AI workflow; отдельного HTTP CRUD `/api/offers` сейчас нет.

- manager может рассчитывать, создавать и отправлять на согласование Offer только по сделке, где `deals.id_employee` совпадает с authenticated manager ID;
- supervisor может работать с Offer по любой сделке;
- роль `user` не может выполнять Offer operations;
- чужая сделка для manager приводит к AI-коду `FORBIDDEN`, который Staff HTTP handler возвращает как HTTP 403 с plain-text body `FORBIDDEN`;
- `offers.created_by` определяется из trusted identity, исходно полученной Go Backend из JWT;
- frontend не передаёт `created_by` или `requested_by`;
- Backend получает цену квартиры из БД и сам рассчитывает `base_price`, `discount_percent`, `final_price`, `max_allowed_discount`, `requires_approval` и статус;
- максимальная скидка manager/supervisor задаётся environment variables Backend;
- повторный request approval для уже `pending_approval` остаётся idempotent.

Статусы Offer:

- `draft`;
- `pending_approval`;
- `approved`;
- `rejected`.

Если скидка не требует согласования, созданный Offer получает `approved`. Если требует — сначала `draft`, затем после RPC request approval — `pending_approval`.

## 9. Схема PostgreSQL

Ниже перечислены все таблицы из migrations `000001`–`000006`.

### users

| Поле | Тип | Nullable | Назначение |
|---|---|---|---|
| `id` | SERIAL | нет | PK пользователя |
| `name` | VARCHAR(255) | нет | Имя |
| `email` | VARCHAR(255) | нет | Уникальный email |
| `password_hash` | VARCHAR(255) | нет | bcrypt hash, никогда не отдаётся API |
| `role` | VARCHAR(50) | нет | `user`, `manager`, `supervisor` |
| `budget_max` | BIGINT | да | Извлечённый максимальный бюджет, >= 0 |
| `preferences` | JSONB | нет | Клиентские предпочтения, default `{}` |

### residential_complexes

| Поле | Тип | Nullable | Назначение |
|---|---|---|---|
| `id` | SERIAL | нет | PK ЖК |
| `name` | VARCHAR(255) | нет | Название |
| `address` | VARCHAR(255) | нет | Адрес |
| `description` | TEXT | да | Описание |

### buildings

| Поле | Тип | Nullable | Назначение |
|---|---|---|---|
| `id` | SERIAL | нет | PK корпуса |
| `residential_complex_id` | INT | нет | FK → `residential_complexes.id` |
| `address` | VARCHAR(255) | нет | Адрес корпуса |
| `latitude` | DECIMAL(10,8) | да | Широта |
| `longitude` | DECIMAL(11,8) | да | Долгота |
| `floors_count` | INT | нет | Число этажей |
| `planned_date` | DATE | да | Плановая дата сдачи |
| `actual_date` | DATE | да | Фактическая дата сдачи |
| `status` | `building_status` | нет | Статус корпуса |
| `type_wall_material` | `wall_material` | нет | Материал стен |
| `district` | VARCHAR(255) | да | Район для factual comparison |

### apartments

| Поле | Тип | Nullable | Назначение |
|---|---|---|---|
| `id` | SERIAL | нет | PK квартиры |
| `building_id` | INT | нет | FK → `buildings.id` |
| `number` | VARCHAR(50) | нет | Номер |
| `rooms` | INT | нет | Комнаты |
| `floor` | INT | нет | Этаж |
| `area` | DECIMAL(10,2) | нет | Площадь |
| `price` | DECIMAL(15,2) | нет | Цена |
| `type_finishing` | `finishing_type` | нет | Тип отделки |
| `status` | `apartment_status` | нет | Статус квартиры |

### construction_progress

| Поле | Тип | Nullable | Назначение |
|---|---|---|---|
| `id` | SERIAL | нет | PK этапа |
| `building_id` | INT | нет | FK → `buildings.id` |
| `stage_name` | `progress_stage` | нет | Этап |
| `planned_start_date` | DATE | да | Плановое начало |
| `actual_start_date` | DATE | да | Фактическое начало |
| `planned_end_date` | DATE | да | Плановое окончание |
| `actual_end_date` | DATE | да | Фактическое окончание |
| `status` | `progress_status` | нет | Статус этапа |
| `completion_percentage` | INT | да | Готовность; default 0, schema не содержит NOT NULL |
| `delay_reason` | VARCHAR(255) | да | Причина задержки |
| `risk_level` | VARCHAR(20) | да | `low`, `medium`, `high` |
| `delay_days` | INT | да | Дни задержки, >= 0 |

### chat_sessions

| Поле | Тип | Nullable | Назначение |
|---|---|---|---|
| `id` | SERIAL | нет | PK сессии |
| `id_user` | INT | да | FK → `users.id`, клиент |
| `id_employee` | INT | да | FK → `users.id`, назначенный сотрудник |
| `id_apartment` | INT | да | FK → `apartments.id` |
| `guest_name` | VARCHAR(255) | да | Имя гостя |
| `guest_email` | VARCHAR(255) | да | Email гостя |
| `guest_phone` | VARCHAR(50) | да | Телефон гостя |
| `status` | `chat_session_status` | нет | Default `open` |
| `created_at` | TIMESTAMP | нет | Создание |
| `updated_at` | TIMESTAMP | нет | Обновление |

### chat_session_rejections

| Поле | Тип | Nullable | Назначение |
|---|---|---|---|
| `id` | SERIAL | нет | PK отказа |
| `id_chat_sessions` | INT | нет | FK → `chat_sessions.id` |
| `id_employee` | INT | нет | FK → `users.id` |
| `reason` | VARCHAR(500) | нет | Причина отказа |
| `created_at` | TIMESTAMP | нет | Дата создания |

### messages

| Поле | Тип | Nullable | Назначение |
|---|---|---|---|
| `id` | SERIAL | нет | PK сообщения |
| `id_chat_session` | INT | нет | FK → `chat_sessions.id` |
| `id_user` | INT | да | FK → `users.id`; AI message имеет `null` |
| `sender_type` | VARCHAR(50) | нет | Default `client`; код использует client/manager/ai/system |
| `content` | TEXT | нет | Текст |
| `is_read` | BOOLEAN | нет | Прочитано, default false |
| `sended_at` | TIMESTAMP | нет | Время отправки |

### deals

| Поле | Тип | Nullable | Назначение |
|---|---|---|---|
| `id` | SERIAL | нет | PK сделки |
| `id_user` | INT | нет | FK → `users.id`, клиент |
| `id_employee` | INT | нет | FK → `users.id`, владелец-manager |
| `id_apartment` | INT | нет | FK → `apartments.id` |
| `id_chat_session` | INT | да | FK → `chat_sessions.id`, добавлен migration 000004 |
| `base_price` | DECIMAL(15,2) | нет | Базовая цена сделки |
| `percent_discount` | DECIMAL(5,2) | нет | Скидка, default 0 |
| `total_price` | DECIMAL(15,2) | нет | Итоговая цена сделки |
| `status` | `deal_status` | нет | Default `pending` |
| `created_at` | TIMESTAMP | нет | Создание |
| `updated_at` | TIMESTAMP | нет | Обновление |

### competitors

| Поле | Тип | Nullable | Назначение |
|---|---|---|---|
| `id` | SERIAL | нет | PK конкурента |
| `project_name` | VARCHAR(255) | нет | Проект конкурента |
| `district` | VARCHAR(255) | нет | Район |
| `price_per_sqm` | BIGINT | да | Цена за м², >= 0 |
| `advantages` | TEXT | да | Подтверждённые преимущества |
| `disadvantages` | TEXT | да | Подтверждённые недостатки |

### recommendations

| Поле | Тип | Nullable | Назначение |
|---|---|---|---|
| `id` | SERIAL | нет | PK рекомендации |
| `deal_id` | INT | нет | FK → `deals.id` |
| `kind` | VARCHAR(100) | нет | Тип рекомендации |
| `recommendation` | TEXT | нет | Текст |
| `request_id` | TEXT | нет | Уникальный idempotency key |
| `created_at` | TIMESTAMP | нет | Создание |

### offers

| Поле | Тип | Nullable | Назначение |
|---|---|---|---|
| `id` | SERIAL | нет | PK Offer |
| `deal_id` | INT | нет | FK → `deals.id` |
| `created_by` | INT | нет | FK → `users.id`, verified actor |
| `base_price` | BIGINT | нет | Базовая цена |
| `discount_percent` | DECIMAL(5,2) | нет | Скидка 0–100 |
| `final_price` | BIGINT | нет | Итоговая цена |
| `generated_text` | TEXT | нет | Текст КП |
| `status` | VARCHAR(30) | нет | Статус Offer с CHECK constraint |
| `approval_required` | BOOLEAN | нет | Требуется согласование |
| `approved_by` | INT | да | FK → `users.id` |
| `approved_at` | TIMESTAMP | да | Время согласования |
| `request_id` | VARCHAR(255) | нет | Уникальный idempotency key |
| `created_at` | TIMESTAMP | нет | Создание |
| `updated_at` | TIMESTAMP | нет | Обновление |

## 10. Связи БД

```text
residential_complexes (1)
  └──< buildings (N)
        ├──< apartments (N)
        │     ├──< chat_sessions (N, nullable link)
        │     └──< deals (N)
        └──< construction_progress (N)

users (client) (1) ──< chat_sessions.id_user
users (employee) (1) ──< chat_sessions.id_employee
chat_sessions (1) ──< messages (N)
users (1) ──< messages.id_user (nullable for AI/system)
chat_sessions (1) ──< chat_session_rejections (N)
users (employee) (1) ──< chat_session_rejections (N)

users (client) (1) ──< deals.id_user
users (employee) (1) ──< deals.id_employee
chat_sessions (1) ──< deals.id_chat_session (nullable)
deals (1) ──< offers (N)
users (creator) (1) ──< offers.created_by
users (approver) (1) ──< offers.approved_by (nullable)
deals (1) ──< recommendations (N)
```

Короткая цепочка объекта сделки:

```text
users → deals → apartments → buildings → residential_complexes
              └→ chat_session → messages
              ├→ offers
              └→ recommendations
buildings → construction_progress
```

`competitors` не имеет foreign key к зданию: выборка Agent workflow выполняется по текстовому `district`.

## 11. Enum и статусы

| Enum/поле | Допустимые значения |
|---|---|
| `building_status` | `design`, `construction`, `completed`, `suspended` |
| `wall_material` | `panel`, `monolith`, `brick`, `block` |
| `finishing_type` | `rough`, `white_box`, `turnkey` |
| `apartment_status` | `free`, `booked`, `sold` |
| `progress_stage` | `excavation`, `foundation`, `frame`, `roofing`, `finishing` |
| `progress_status` | `not_started`, `in_progress`, `completed`, `delayed` |
| `chat_session_status` | `open`, `in_progress`, `close` |
| `deal_status` | `pending`, `contract`, `completed`, `cancelled` |
| `offers.status` | `draft`, `pending_approval`, `approved`, `rejected` |
| `construction_progress.risk_level` | `low`, `medium`, `high` или null |
| `users.role` | `user`, `manager`, `supervisor` |

## 12. Примеры frontend fetch

### Login сотрудника

```js
const STAFF_API = "http://localhost:8081";

const response = await fetch(`${STAFF_API}/api/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  credentials: "include",
  body: JSON.stringify({ email, password }),
});

if (!response.ok) throw new Error(await response.text());
const { token, user } = await response.json();
// token можно держать в состоянии приложения и передавать как Bearer.
```

### Список chat sessions сотрудника

```js
const response = await fetch(
  `${STAFF_API}/api/chat/sessions?status=open`,
  {
    headers: { Authorization: `Bearer ${token}` },
    credentials: "include",
  },
);

if (!response.ok) throw new Error(await response.text());
const sessions = await response.json();
```

Для клиента используется `http://localhost:8080/api/chat/sessions`; этот endpoint сам фильтрует сессии по ID из JWT.

### AI chat

```js
const response = await fetch(`${STAFF_API}/api/ai/chat`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  credentials: "include",
  body: JSON.stringify({
    message: "Клиент говорит, что у конкурента дешевле",
    session_id: 1,
    deal_id: 7,
  }),
});

if (!response.ok) {
  const errorText = await response.text();
  throw new Error(`${response.status}: ${errorText}`);
}

const answer = await response.json();
// { message: string, agent: string, intent: string }
```

## 13. Ошибки

Handlers используют `http.Error`, поэтому большинство ошибок имеют `text/plain`, а не единый JSON error DTO.

| HTTP status | Реальные случаи |
|---|---|
| 400 | Невалидный JSON/path ID, пустое сообщение, обязательные поля, invalid role, invalid discount/deal data |
| 401 | Нет/невалидный JWT, неверные login credentials, AI chat без authenticated identity |
| 403 | Client пытается войти в Staff API; staff-only middleware; manager создаёт Offer по чужой сделке |
| 404 | Не найден пользователь, чат, сделка, ЖК, корпус, квартира или progress entity в соответствующих GET handlers |
| 409 | Повторная регистрация email (`user already exists`) |
| 500 | Ошибка repository/service; Agent error, который не имеет отдельного HTTP mapping |
| 503 | RabbitMQ/AI service недоступен при `/api/ai/chat` |
| 504 | Agent RPC не ответил за 75 секунд |

AI Agent использует структурированный RabbitMQ error envelope, но HTTP handler разворачивает успешный результат до `{message,agent,intent}`. `FORBIDDEN` отдельно преобразуется в HTTP 403. Другие Agent errors сейчас обычно становятся HTTP 500 с plain-text сообщением.

Реальные Agent/Backend codes, которые присутствуют в текущем коде:

- `VALIDATION_ERROR`;
- `FORBIDDEN`;
- `INTERNAL_ERROR`;
- `TIMEOUT`;
- `BACKEND_ERROR`;
- `BACKEND_RESPONSE_ERROR`;
- `BACKEND_UNAVAILABLE`;
- `NO_CLIENT_MESSAGES`;
- `ANALYSIS_ERROR`;
- `DEAL_NOT_FOUND`;
- `CLIENT_NOT_FOUND`;
- `USER_NOT_FOUND`;
- `APARTMENT_NOT_FOUND`;
- `BUILDING_NOT_FOUND`;
- `BUILDING_DATA_INCOMPLETE`;
- `OFFER_NOT_FOUND`;
- `INVALID_DISCOUNT`;
- `INVALID_OFFER_STATE`.

Не все backend-specific codes обязательно доходят до frontend: отдельные агенты преобразуют некоторые ошибки данных в безопасный текст при HTTP 200.

## 14. Локальный запуск

### Go Backend, PostgreSQL и RabbitMQ

Из корня `DSK_Agent`:

```bash
cp backend/.env-example backend/.env
# Заполнить backend/.env локальными значениями без коммита секретов.
docker compose up --build -d
docker compose ps
```

Compose запускает PostgreSQL, RabbitMQ, `user-server` и `staff-server`. Python Agent Service в текущий `docker-compose.yml` не включён.

Разрешённые browser origins задаются в `backend/.env` через comma-separated переменную `CORS_ALLOWED_ORIGINS`. Значение по умолчанию ориентировано на локальный Vite frontend: `http://localhost:5173`, `http://127.0.0.1:5173`, `http://localhost:4173`, `http://127.0.0.1:4173`. Для других окружений нужно перечислить их точные origins; wildcard `*` при включённых credentials запрещён.

Миграции смонтированы в `/docker-entrypoint-initdb.d`. PostgreSQL image выполняет их при первоначальной инициализации нового data volume; добавление migration-файла само по себе не применяет его повторно к уже созданной БД.

### Agent Service

В отдельном терминале:

```bash
cd agent-service
cp .env.example .env
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Для запуска Agent Service на хосте в `.env` нужен адрес RabbitMQ через `localhost:5672`; значение `rabbitmq:5672` работает только внутри общей Docker network. Обязательны `RABBITMQ_URL` и `GIGACHAT_CREDENTIALS`. Реальные ключи и JWT secret не коммитить.

Проверка:

```bash
curl http://localhost:8000/health
curl http://localhost:8080/swagger/doc.json
curl http://localhost:8081/swagger/doc.json
```

## 15. Что frontend не должен делать

- Не подключаться напрямую к PostgreSQL.
- Не подключаться напрямую к RabbitMQ.
- Не публиковать `agent.*`, `backend.*` или `event.*` messages.
- Не вызывать Agent Service напрямую; его HTTP API содержит только diagnostic `/health`, а рабочие команды идут через Go Backend.
- Не передавать или подменять `user_id`, `id_employee`, `created_by`, `requested_by`.
- Не рассчитывать Offer `base_price`, `final_price`, `requires_approval` или status.
- Не хранить и не дублировать manager/supervisor discount policy.
- Не считать `agent`/`intent` входными параметрами: они являются результатом AI routing.
- Не полагаться на RabbitMQ `request_id`/`correlation_id`: это транспортные детали Go Backend.

## 16. Известные спорные места текущего кода

1. `POST /api/auth/register` staff-server сейчас публичен и позволяет выбрать `manager` или `supervisor`. Для production это security gap; frontend не должен показывать публичную регистрацию supervisor без отдельного решения Backend.
2. Некоторые user-server detail handlers (`GET /api/chat/sessions/{id}`, messages и `GET /api/deals/{id}`) проверяют JWT, но не проверяют ownership объекта в handler/service. Не считать это гарантией доступа к данным другого клиента; требуется отдельное backend hardening.
3. Нет HTTP endpoints для Dialog Analyze, Reply Assist, offers CRUD/approval и event publication. Не создавать frontend-вызовы к несуществующим URL.
4. HTTP errors не унифицированы: чаще это plain text. Frontend должен сначала проверять `response.ok`, а JSON читать только для успешных JSON endpoints.

## 17. Checklist frontend-интеграции

- Выбран правильный base URL: 8080 для client, 8081 для staff.
- Все business IDs передаются как integer.
- JWT передаётся Bearer header или cookie с `credentials: "include"`.
- Для AI chat существует chat session и передаётся положительный `session_id`.
- Для factual Negotiation/Analytics/Offer передаётся `deal_id`.
- Frontend обрабатывает 75-секундный AI timeout и не отправляет дубли автоматически без UX/idempotency решения.
- Offer расчёты отображаются только из ответа Backend/Agent, не считаются на frontend.
- Не используются отсутствующие HTTP routes для Dialog Analyze, Reply Assist или events.
