export type CommonPattern = {
  readonly label: string
  readonly pattern: string
  readonly flags: string
}

export const COMMON_PATTERNS: readonly CommonPattern[] = [
  {
    label: 'Email',
    pattern: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}',
    flags: 'gi',
  },
  {
    label: 'URL',
    pattern: 'https?://[^\\s/$.?#].[^\\s]*',
    flags: 'gi',
  },
  {
    label: 'Phone (US)',
    pattern: '\\(?\\d{3}\\)?[-.\\s]?\\d{3}[-.\\s]?\\d{4}',
    flags: 'g',
  },
  {
    label: 'IPv4',
    pattern: '\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b',
    flags: 'g',
  },
  {
    label: 'Date (YYYY-MM-DD)',
    pattern: '\\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\\d|3[01])',
    flags: 'g',
  },
  {
    label: 'Hex Color',
    pattern: '#(?:[0-9a-fA-F]{3}){1,2}\\b',
    flags: 'gi',
  },
  {
    label: 'HTML Tag',
    pattern: '<([a-zA-Z][a-zA-Z0-9]*)\\b[^>]*>.*?</\\1>',
    flags: 'gs',
  },
  {
    label: 'UUID',
    pattern: '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}',
    flags: 'gi',
  },
  {
    label: 'Integer',
    pattern: '-?\\d+',
    flags: 'g',
  },
  {
    label: 'Whitespace runs',
    pattern: '\\s{2,}',
    flags: 'g',
  },
]
