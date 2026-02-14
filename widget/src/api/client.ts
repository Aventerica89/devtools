/**
 * API client for widget-to-dashboard communication.
 * All requests include the pin hash for authentication.
 */

export interface ApiClient {
  readonly createBug: (
    data: Record<string, unknown>
  ) => Promise<unknown>
  readonly createDevLog: (
    data: Record<string, unknown>
  ) => Promise<unknown>
  readonly sendEvents: (
    events: unknown[]
  ) => Promise<unknown>
}

export function createApiClient(
  apiBase: string,
  pinHash: string
): ApiClient {
  async function request(
    path: string,
    options: RequestInit = {}
  ): Promise<unknown> {
    const res = await fetch(`${apiBase}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-DevTools-Pin': pinHash,
        ...(options.headers as Record<string, string> | undefined),
      },
    })
    return res.json()
  }

  return {
    createBug: (data: Record<string, unknown>) =>
      request('/api/bugs', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    createDevLog: (data: Record<string, unknown>) =>
      request('/api/devlog', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    sendEvents: (events: unknown[]) =>
      request('/api/widget/event', {
        method: 'POST',
        body: JSON.stringify({ events }),
      }),
  }
}
