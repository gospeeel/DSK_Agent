<template>
  <section class="max-w-3xl rounded-xl border border-ink/10 bg-sheet p-6">
    <h2 class="text-xl font-semibold">Предложения временно недоступны</h2>
    <p class="mt-3 text-sm leading-6 text-muted">
      Подключение реестра КП, согласования и готовых PDF ещё не завершено. Созданные сделки доступны
      в отдельном разделе.
    </p>
    <RouterLink
      to="/deals"
      class="mt-5 inline-block rounded-lg bg-blueprint px-4 py-3 text-sm text-white"
      >Открыть сделки</RouterLink
    >
  </section>
</template>
