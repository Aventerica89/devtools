import { installConsoleInterceptor } from './console'

/**
 * Network and error interceptors.
 * Console interceptor installed here; network and error interceptors
 * will be added in future tasks.
 */
export function initInterceptors(
  _projectId: string,
  _pinHash: string,
  _apiBase: string
): void {
  installConsoleInterceptor()

  // Future:
  // - Network intercept (fetch, XHR)
  // - Global error handler (window.onerror, unhandledrejection)
}
