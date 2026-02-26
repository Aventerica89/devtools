import { cn } from '@/lib/utils'

type Props = {
  content: string
  className?: string
}

export function ChangelogRenderer({ content, className }: Props) {
  const lines = content.split('\n')

  const elements = lines.map((line, i) => {
    const trimmed = line.trimEnd()

    // ## v1.2.3 - Date  (version heading)
    if (/^## /.test(trimmed)) {
      const heading = trimmed.replace(/^## /, '')
      return (
        <h2 key={i} className="text-lg font-bold text-foreground mt-6 mb-2 first:mt-0">
          {renderInline(heading)}
        </h2>
      )
    }

    // ### Section heading
    if (/^### /.test(trimmed)) {
      const heading = trimmed.replace(/^### /, '')
      return (
        <h3 key={i} className="text-sm font-semibold text-foreground mt-4 mb-1">
          {renderInline(heading)}
        </h3>
      )
    }

    // - List item
    if (/^[-*] /.test(trimmed)) {
      const text = trimmed.replace(/^[-*] /, '')
      return (
        <li key={i} className="text-sm text-muted-foreground ml-4 list-disc">
          {renderInline(text)}
        </li>
      )
    }

    // Empty line
    if (trimmed === '') {
      return <div key={i} className="h-2" />
    }

    // Regular paragraph
    return (
      <p key={i} className="text-sm text-muted-foreground">
        {renderInline(trimmed)}
      </p>
    )
  })

  return (
    <div className={cn('space-y-0.5', className)}>
      {elements}
    </div>
  )
}

function renderInline(text: string): React.ReactNode {
  // Process **bold**, `code`, and plain text
  const parts: React.ReactNode[] = []
  let remaining = text
  let key = 0

  while (remaining.length > 0) {
    // Check for **bold**
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/)
    // Check for `code`
    const codeMatch = remaining.match(/`(.+?)`/)

    // Find the earliest match
    const boldIdx = boldMatch?.index ?? Infinity
    const codeIdx = codeMatch?.index ?? Infinity

    if (boldIdx === Infinity && codeIdx === Infinity) {
      parts.push(remaining)
      break
    }

    if (boldIdx <= codeIdx && boldMatch) {
      // Add text before bold
      if (boldIdx > 0) {
        parts.push(remaining.slice(0, boldIdx))
      }
      parts.push(
        <strong key={key++} className="text-foreground font-semibold">
          {boldMatch[1]}
        </strong>
      )
      remaining = remaining.slice(boldIdx + boldMatch[0].length)
    } else if (codeMatch) {
      // Add text before code
      if (codeIdx > 0) {
        parts.push(remaining.slice(0, codeIdx))
      }
      parts.push(
        <code key={key++} className="bg-accent px-1 py-0.5 rounded text-xs font-mono">
          {codeMatch[1]}
        </code>
      )
      remaining = remaining.slice(codeIdx + codeMatch[0].length)
    }
  }

  return parts.length === 1 && typeof parts[0] === 'string' ? parts[0] : parts
}
