# DSK Agent

DSK Agent — система для автоматизации работы менеджеров по продаже недвижимости с использованием AI-ассистента на базе GigaChat.

Система объединяет CRM-интерфейс, backend-сервисы, RabbitMQ, PostgreSQL и отдельный Agent Service. AI-ассистент помогает менеджеру анализировать диалоги с клиентами, работать с возражениями, оценивать риски строительства и формировать коммерческие предложения.

---

## Основные возможности

- общий AI-ассистент;
- помощь в переговорах с клиентом;
- обработка ценовых возражений;
- сравнение предложения с конкурентами;
- анализ строительных рисков;
- анализ диалога с клиентом;
- извлечение предпочтений клиента;
- генерация черновика ответа;
- формирование коммерческого предложения;
- поддержка скидок;
- согласование скидок руководителем;
- multi-turn сценарии;
- обработка событий задержки строительства;
- формирование рекомендаций для менеджера.

---

## Архитектура

```text
Frontend
   |
   v
Go Backend
   |
   v
RabbitMQ
   |
   v
Agent Service
   |
   v
GigaChat

Go Backend
   |
   v
PostgreSQL
```

Frontend не обращается напрямую к RabbitMQ, PostgreSQL или Agent Service. Все пользовательские запросы проходят через Go Backend.

---

## Структура проекта

```text
DSK_Agent/
├── backend/
│   ├── cmd/
│   │   ├── user_server/
│   │   └── staff_server/
│   ├── internal/
│   ├── migrations/
│   ├── seeds/
│   └── scripts/
├── agent-service/
│   ├── app/
│   ├── scripts/
│   └── tests/
├── frontend/
│   └── src/
├── frontend-old/
├── docker-compose.yml
└── README.md
```

## Backend

Backend написан на Go и содержит два HTTP-сервиса:

- `user-server` — API для клиентов;
- `staff-server` — API для менеджеров и руководителей.

Backend отвечает за авторизацию, пользователей, клиентов, сделки, квартиры, чаты, коммерческие предложения, согласование предложений, бизнес-логику, PostgreSQL и взаимодействие с Agent Service через RabbitMQ.

---

## Agent Service

Agent Service написан на Python.

Основные технологии:

- FastAPI
- LangGraph
- GigaChat
- aio-pika
- Pydantic

Agent Service получает запросы через RabbitMQ, определяет необходимый AI-сценарий и при необходимости запрашивает дополнительные данные у Backend.

Agent Service не имеет прямого доступа к PostgreSQL. Backend является источником бизнес-данных и бизнес-логики.

---

## AI-агенты

### General Agent

```text
Привет! Расскажи, чем ты можешь помочь менеджеру по продажам.
```

### Negotiation Agent

```text
Клиент говорит, что у конкурента похожая квартира дешевле.
Помоги подготовить аргументы для переговоров.
```

### Construction Analytics Agent

```text
Проанализируй риски по строительству для этой сделки.
```

### Offer Agent

```text
Сформируй коммерческое предложение со скидкой 3%.
```

Backend самостоятельно определяет базовую цену, итоговую цену, допустимость скидки, необходимость согласования и статус предложения.

Поддерживается multi-turn:

```text
Менеджер:
Сделай предложение с хорошей скидкой.

AI:
Какой процент скидки вы хотите указать?

Менеджер:
3%
```

### Dialog Analyze

Анализирует переписку и извлекает:

- бюджет;
- количество комнат;
- минимальный этаж;
- парковку;
- район;
- важные факторы;
- возражения.

### Reply Assist

Формирует черновик ответа на последнее сообщение клиента с учётом истории переписки, сделки, квартиры, объекта и конкурентов.

---

## AI Assistant во Frontend

В интерфейсе менеджера есть плавающая кнопка `Ассистент`.

В отдельном окне доступны режимы:

```text
Общий
Переговоры
Риски
КП
Анализ клиента
Черновик ответа
```

AI-ассистент работает отдельно от CRM-чата. Черновик ответа можно вставить в composer клиентского чата без автоматической отправки.

---

## Роли

```text
client
manager
supervisor
```

### Manager

- работает со своими клиентами;
- ведёт сделки;
- использует AI-ассистента;
- создаёт коммерческие предложения.

### Supervisor

- просматривает предложения;
- согласовывает скидки;
- отклоняет предложения;
- работает со сделками менеджеров.

---

## Политика скидок

```env
MAX_MANAGER_DISCOUNT_PERCENT=5
MAX_SUPERVISOR_DISCOUNT_PERCENT=15
```

Статусы предложения:

```text
draft
pending_approval
approved
rejected
```

---

## RabbitMQ

Exchange:

```text
app.topic
```

Примеры Backend RPC:

```text
backend.deal.get
backend.client.get
backend.apartment.get
backend.building.get
backend.deal.messages.get
backend.competitor.list
backend.construction.events.get
backend.offer.calculate
backend.offer.create
backend.offer.request_approval
backend.offer.get
```

---

## PostgreSQL

Хранит:

- пользователей;
- клиентов;
- объекты;
- квартиры;
- сделки;
- чаты;
- сообщения;
- прогресс строительства;
- конкурентов;
- AI-рекомендации;
- коммерческие предложения.

---

# Локальный запуск

## Требования

- Docker
- Docker Compose
- Git
- Node.js и npm
- Python 3.12

## 1. Клонирование

```bash
git clone https://github.com/gospeeel/DSK_Agent.git
cd DSK_Agent
```

## 2. `.env`

Пример:

```env
DB_USER=postgres_user
DB_PASS=postgres_password
DB_NAME=dsk

RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672/

GIGACHAT_CREDENTIALS=YOUR_GIGACHAT_CREDENTIALS
GIGACHAT_SCOPE=GIGACHAT_API_PERS
GIGACHAT_MODEL=GigaChat-2-Max

MAX_MANAGER_DISCOUNT_PERCENT=5
MAX_SUPERVISOR_DISCOUNT_PERCENT=15

CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

Не коммитьте `.env` с реальными ключами.

## 3. Инфраструктура

```bash
docker compose up -d --build database rabbitmq staff-server user-server
docker compose ps
```

Ожидается:

```text
database       healthy
rabbitmq       healthy
staff-server   healthy
user-server    healthy
```

## 4. Demo data

```bash
sh backend/scripts/seed-demo.sh
```

Связь данных:

```text
manager
→ chat session
→ client
→ deal
→ apartment
→ building
→ construction progress
→ competitor
```

## 5. Agent Service

```bash
cd agent-service
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Health:

```text
http://localhost:8000/health
```

## 6. Frontend

```bash
cd frontend
npm install
npm run dev
```

```text
http://localhost:5173
```

---

## Swagger

```text
Staff API: http://localhost:8081/swagger/
User API:  http://localhost:8080/swagger/
```

## RabbitMQ Management

```text
http://localhost:15672
login: guest
password: guest
```

---

# Demo-сценарий

1. Войти под demo-manager.
2. Открыть клиентский диалог.
3. Нажать `Ассистент`.
4. Проверить Negotiation:
   `Клиент говорит, что у конкурента похожая квартира дешевле.`
5. Проверить Construction Analytics:
   `Проанализируй риски по строительству.`
6. Создать Offer:
   `Сформируй коммерческое предложение со скидкой 3%.`
7. Проверить multi-turn:
   `Сделай предложение с хорошей скидкой.` → `3%`
8. Использовать `Анализ клиента`.
9. Использовать `Черновик ответа`.
10. Войти под supervisor и проверить согласование предложения выше лимита менеджера.

---

# Тестирование

Backend:

```bash
cd backend
go test ./...
```

Agent Service:

```bash
cd agent-service
pytest
python -m compileall app
```

Frontend:

```bash
cd frontend
npm run build
```

Git:

```bash
git diff --check
```

---

# Live E2E

```text
General Chat                    PASS
Negotiation                     PASS
Construction Analytics          PASS
Offer 0%                        PASS
Offer 3%                        PASS
Offer 7%                        PASS
Multi-turn Offer                PASS
Dialog Analyze                  PASS
Reply Assist                    PASS
Supervisor Approve              PASS
Supervisor Reject               PASS
Manager foreign deal → 403      PASS
Construction Delay Event        PASS
```

---

# Deployment

Рекомендуемое окружение:

```text
1 VPS
4 vCPU
8 GB RAM
50+ GB SSD
Ubuntu
Docker Compose
Nginx
HTTPS
```

Архитектура:

```text
Internet
   |
 HTTPS
   |
 Nginx
   |
Frontend
   |
Backend
   |
RabbitMQ
   |
Agent Service
   |
GigaChat

PostgreSQL
```

PostgreSQL и RabbitMQ не должны быть публично доступны из интернета.

---

# Обновление

```bash
git pull origin main
docker compose up -d --build
docker compose ps
```

Логи:

```bash
docker compose logs -f
docker compose logs -f agent-service
```

---

# Безопасность

Не хранить в Git:

```text
.env
GIGACHAT_CREDENTIALS
JWT secrets
пароли PostgreSQL
пароли RabbitMQ
production credentials
```

Для production необходимо использовать HTTPS.

---

# Технологии

### Frontend
- React
- TypeScript
- Vite

### Backend
- Go
- PostgreSQL
- RabbitMQ

### Agent Service
- Python
- FastAPI
- LangGraph
- GigaChat
- Pydantic
- aio-pika

### Infrastructure
- Docker
- Docker Compose
- Nginx

---

# Статус проекта

Основные AI workflow реализованы и успешно проверены через live E2E.

Система готова для демонстрации.
