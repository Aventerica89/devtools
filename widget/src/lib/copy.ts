import type { ConsoleEntry } from '../interceptors/console'
import type { NetworkEntry } from '../interceptors/network'
import type { ErrorEntry } from '../interceptors/errors'
import type { HealthIssue } from '../interceptors/health'

export function formatConsoleRow(entry: ConsoleEntry): string {
  const ts = new Date(entry.timestamp).toLocaleTimeString()
  return `[${entry.level.toUpperCase()}] ${entry.args.join(' ')} — ${ts}`
}

export function formatNetworkRow(entry: NetworkEntry): string {
  return `[NETWORK] ${entry.method} ${entry.url} → ${entry.status}  ${entry.duration}ms`
}

export function formatErrorRow(entry: ErrorEntry): string {
  return `[ERROR] ${entry.message}\n  ${entry.stack ?? ''}`.trimEnd()
}

export function formatHealthRow(issue: HealthIssue): string {
  return `[${issue.severity.toUpperCase()}] ${issue.message}${issue.detail ? ` — ${issue.detail}` : ''}`
}

export function formatConsoleTab(entries: ConsoleEntry[]): string {
  return `### Console (${entries.length})\n${entries.map(formatConsoleRow).join('\n')}`
}

export function formatNetworkTab(entries: NetworkEntry[]): string {
  return `### Network (${entries.length})\n${entries.map(formatNetworkRow).join('\n')}`
}

export function formatErrorsTab(entries: ErrorEntry[]): string {
  return `### Errors (${entries.length})\n${entries.map(formatErrorRow).join('\n\n')}`
}

export function formatHealthTab(issues: HealthIssue[]): string {
  return `### Health Issues (${issues.length})\n${issues.map(formatHealthRow).join('\n')}`
}

export function buildCopyForClaudeBundle(
  consoleEntries: ConsoleEntry[],
  networkEntries: NetworkEntry[],
  errorEntries: ErrorEntry[],
  healthIssues: HealthIssue[],
): string {
  const errors = errorEntries.slice(0, 10)
  const warnings = consoleEntries.filter((e) => e.level === 'warn').slice(0, 10)
  const netIssues = networkEntries.filter((e) => e.status >= 400).slice(0, 10)
  const now = new Date().toLocaleString()

  const sections: string[] = [
    `## Page Context — ${window.location.href}`,
    `**Captured:** ${now}`,
  ]

  if (errors.length > 0) sections.push(formatErrorsTab(errors))
  if (warnings.length > 0) {
    sections.push(`### Console Warnings (${warnings.length})\n${warnings.map(formatConsoleRow).join('\n')}`)
  }
  if (netIssues.length > 0) {
    sections.push(`### Network Issues (${netIssues.length})\n${netIssues.map(formatNetworkRow).join('\n')}`)
  }
  if (healthIssues.length > 0) sections.push(formatHealthTab(healthIssues))

  return sections.join('\n\n')
}
