import { installConsoleInterceptor } from './console'
import { installNetworkInterceptor } from './network'

/**
 * Interceptors for console, network, and errors.
 * Console and network interceptors installed here; error interceptor
 * will be added in a future task.
 */
export function initInterceptors(
  _projectId: string,
  _pinHash: string,
  _apiBase: string
): void {
  installConsoleInterceptor()
  installNetworkInterceptor()

  // Future:
  // - Global error handler (window.onerror, unhandledrejection)
}
