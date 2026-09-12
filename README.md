# ДСК · AI-помощник продаж

Весь проект запускается из корня одной командой:

```bash
docker compose up --build
```

После запуска доступны:

- интерфейс — <http://localhost:5173>;
- User API Swagger — <http://localhost:8080/swagger/>;
- Staff API Swagger — <http://localhost:8081/swagger/>;
- Agent Service health — <http://localhost:8000/health>;
- RabbitMQ Management — <http://localhost:15672> (`guest` / `guest`).

## AI-агент

Для локального запуска создавать `.env` необязательно. Для реальных ответов GigaChat
скопируйте корневой `.env.example` в `.env` и укажите `GIGACHAT_CREDENTIALS`. Без
ключа все контейнеры поднимутся, но AI-запросы не смогут пройти авторизацию в GigaChat.

## Демонстрационные данные

После первого запуска или пересоздания базы примените миграции совместимости и seed:

```bash
sh backend/scripts/seed-demo.sh
```

Тестовые сотрудники:

- менеджер: `manager@dsk.demo` / `Demo123!`;
- руководитель: `supervisor@dsk.demo` / `Demo123!`.

Остановка проекта:

```bash
docker compose down
```
