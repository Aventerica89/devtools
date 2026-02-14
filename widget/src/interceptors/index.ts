import { installConsoleInterceptor } from './console'
import { installNetworkInterceptor } from './network'
import { installErrorInterceptor } from './errors'

/**
 * Interceptors for console, network, and errors.
 * All three interceptors are installed here at startup.
 */
export function initInterceptors(
  _projectId: string,
  _pinHash: string,
  _apiBase: string
): void {
  installConsoleInterceptor()
  installNetworkInterceptor()
  installErrorInterceptor()
}
