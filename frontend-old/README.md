
## Стек

- Vue 3, TypeScript, Vite
- Pinia — клиентское состояние приложения
- TanStack Vue Query — серверное состояние и мутации
- Tailwind CSS — стилизация
- Vitest и Playwright — unit и E2E-проверки

## Запуск

```sh
pnpm install
pnpm dev
```

## Проверки

```sh
pnpm type-check
pnpm test
pnpm test:e2e
pnpm lint
pnpm build
```

## Источник данных

Подключены реальные HTTP API: клиентский сервис 8080 и сервис сотрудников 8081.
При недоступном backend показывается ошибка, подстановки моков нет.
При необходимости создайте `.env.local` по образцу `.env.example`:

```sh
USER_API_TARGET=http://127.0.0.1:8080
STAFF_API_TARGET=http://127.0.0.1:8081
```

Контракты находятся в `src/shared/api/backend-contracts.ts`, транспорт — `transport.ts`.
Сессия использует HttpOnly cookie. Vite проксирует `/user-api/api/*` и `/staff-api/api/*`.
Для production нужны аналогичные reverse proxy правила; `vite preview` не является production-сервером.

Это промежуточная интеграция, не завершённая миграция всех сценариев.
Реализованные функции, блокеры backend и оставшиеся задачи: [FRONTEND_MIGRATION_STATUS.md](../FRONTEND_MIGRATION_STATUS.md).
Playwright использует HTTP fixtures только в тестах; это не проверка работающих Go-сервисов.
