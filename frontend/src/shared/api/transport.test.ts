import { afterEach, expect, it, vi } from 'vitest'
import { apiId, apiRequest, onUnauthorized } from './transport'

afterEach(() => {
  vi.unstubAllGlobals()
  onUnauthorized(() => {})
})
it('uses cookies and the correct audience without storing a token', async () => {
  const fetch = vi.fn().mockResolvedValue(new Response('{"id":7}'))
  vi.stubGlobal('fetch', fetch)
  expect(await apiRequest('staff', '/users/7')).toEqual({ id: 7 })
  expect(fetch).toHaveBeenCalledWith(
    '/staff-api/api/users/7',
    expect.objectContaining({ credentials: 'include' }),
  )
})
it('handles plain text errors and expires protected sessions', async () => {
  const expired = vi.fn()
  onUnauthorized(expired)
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation(async () => new Response('expired', { status: 401 })),
  )
  await expect(apiRequest('user', '/deals')).rejects.toMatchObject({
    status: 401,
    message: 'expired',
  })
  expect(expired).toHaveBeenCalledOnce()
  expired.mockClear()
  await expect(apiRequest('user', '/auth/login', { authRequest: true })).rejects.toMatchObject({
    status: 401,
  })
  expect(expired).not.toHaveBeenCalled()
})
it('accepts empty success and rejects malformed JSON', async () => {
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(new Response('<html>')),
  )
  expect(await apiRequest('staff', '/chat/sessions/7/close')).toBeUndefined()
  await expect(apiRequest('user', '/deals')).rejects.toMatchObject({ status: 502 })
})
it('does not retry failed mutations', async () => {
  const fetch = vi.fn().mockRejectedValue(new TypeError('offline'))
  vi.stubGlobal('fetch', fetch)
  await expect(apiRequest('user', '/chat/sessions', { method: 'POST' })).rejects.toMatchObject({
    status: 0,
  })
  expect(fetch).toHaveBeenCalledOnce()
})
it('rejects synthetic and unsafe identifiers', () => {
  expect(apiId('27')).toBe(27)
  for (const id of ['c-101', '-1', '0', '1.5', '1e2', '9007199254740992'])
    expect(() => apiId(id)).toThrow()
})
