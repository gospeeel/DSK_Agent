# Agent Service

Асинхронный Python 3.12 микросервис, который принимает chat-команды от Go Backend через RabbitMQ, вызывает GigaChat и возвращает результат по стандартному RPC-контракту RabbitMQ (`reply_to` + `correlation_id`). Сервис не подключается к PostgreSQL.

## Структура

```text
agent-service/
├── app/
│   ├── main.py
│   ├── config.py
│   ├── broker/
│   │   ├── connection.py
│   │   ├── consumer.py
│   │   └── publisher.py
│   ├── llm/
│   │   └── gigachat.py
│   └── schemas/
│       ├── messages.py
│       └── responses.py
├── tests/
├── .env.example
├── requirements.txt
├── Dockerfile
└── README.md
```

## RabbitMQ

При запуске сервис объявляет:

- durable topic exchange `app.topic`;
- durable queue `agent-service`;
- binding с routing key `agent.chat.request`.

Имя каждого объекта можно изменить environment variable. Ответ публикуется в default exchange с routing key из `reply_to`, исходный `correlation_id` сохраняется. ACK отправляется только после успешной публикации ответа. При сбое публикации исходное сообщение возвращается в очередь.

## Конфигурация

Скопируйте `.env.example` и экспортируйте значения в окружение. Приложение намеренно не читает `.env` самостоятельно: единственный источник конфигурации — environment variables.

Обязательные переменные:

```bash
export RABBITMQ_URL='amqp://guest:guest@localhost:5672/'
export GIGACHAT_CREDENTIALS='<authorization-key>'
```

Для production оставляйте `GIGACHAT_VERIFY_SSL_CERTS=true` и установите доверенный корневой сертификат. При необходимости укажите путь через `GIGACHAT_CA_BUNDLE_FILE`.

## Локальный запуск

```bash
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
set -a
source .env
set +a
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Health check:

```bash
curl http://localhost:8000/health
```

Endpoint отвечает `200`, если robust connection к RabbitMQ активен, и `503` в противном случае.

## Docker

```bash
docker build -t agent-service .
docker run --rm -p 8000:8000 --env-file .env agent-service
```

Если RabbitMQ запущен на хосте, задайте доступный из контейнера адрес, например `host.docker.internal`, вместо `localhost`.

## Контракт запроса

```json
{
  "request_id": "11111111-1111-1111-1111-111111111111",
  "action": "chat",
  "payload": {
    "user_id": "22222222-2222-2222-2222-222222222222",
    "session_id": "33333333-3333-3333-3333-333333333333",
    "deal_id": null,
    "message": "Привет"
  }
}
```

Успешный ответ:

```json
{
  "request_id": "11111111-1111-1111-1111-111111111111",
  "success": true,
  "data": {"message": "Здравствуйте!"},
  "error": null
}
```

Ошибка обработки:

```json
{
  "request_id": "11111111-1111-1111-1111-111111111111",
  "success": false,
  "data": null,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Failed to generate a response"
  }
}
```

Некорректный запрос с валидным `request_id` получает код `INVALID_REQUEST`. Сообщение без валидного `request_id` или без `reply_to` отклоняется без повторной постановки, так как корректный RPC-ответ для него сформировать невозможно.

## Тесты

```bash
pytest -q
```
