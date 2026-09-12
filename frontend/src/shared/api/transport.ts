import type { ApiAudience } from './backend-contracts'

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}
let unauthorized: (() => void) | undefined
export const onUnauthorized = (callback: () => void) => {
  unauthorized = callback
}

export function apiId(value: string | number): number {
  const id = Number(value)
  if (!/^\d+$/.test(String(value)) || !Number.isSafeInteger(id) || id <= 0)
    throw new ApiError(400, 'Некорректный идентификатор')
  return id
}

export async function apiRequest<T>(
  audience: ApiAudience,
  path: string,
  options: RequestInit & { timeout?: number; authRequest?: boolean } = {},
): Promise<T> {
  const { timeout = 20_000, authRequest = false, ...init } = options
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)
  const abort = () => controller.abort()
  init.signal?.addEventListener('abort', abort, { once: true })
  if (init.signal?.aborted) controller.abort()
  try {
    const response = await fetch(`/${audience}-api/api${path}`, {
      ...init,
      credentials: 'include',
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...init.headers,
      },
    })
    const raw = await response.text()
    if (!response.ok) {
      if (response.status === 401 && !authRequest) unauthorized?.()
      throw new ApiError(response.status, raw || `Ошибка запроса (${response.status})`)
    }
    if (!raw.trim()) return undefined as T
    try {
      return JSON.parse(raw) as T
    } catch {
      throw new ApiError(502, 'Сервер вернул некорректный ответ')
    }
  } catch (error) {
    if (error instanceof ApiError) throw error
    if (controller.signal.aborted)
      throw new ApiError(
        408,
        'Время ожидания истекло. Проверьте результат перед повторной отправкой.',
      )
    throw new ApiError(0, 'Нет соединения с сервером. Проверьте подключение и повторите запрос.')
  } finally {
    clearTimeout(timer)
    init.signal?.removeEventListener('abort', abort)
  }
}

export async function apiFileRequest(audience: ApiAudience, path: string): Promise<Blob> {
  try {
    const response = await fetch(`/${audience}-api/api${path}`, {
      credentials: 'include',
      headers: { Accept: 'application/pdf' },
    })
    if (!response.ok) {
      if (response.status === 401) unauthorized?.()
      throw new ApiError(response.status, (await response.text()) || `Ошибка запроса (${response.status})`)
    }
    return response.blob()
  } catch (error) {
    if (error instanceof ApiError) throw error
    throw new ApiError(0, 'Не удалось скачать файл. Проверьте подключение и повторите запрос.')
  }
}
