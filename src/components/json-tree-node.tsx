'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Copy, Check } from 'lucide-react'

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue }

export type NodeProps = {
  readonly path: string
  readonly keyName?: string
  readonly searchTerm: string
  readonly onPathCopy: (path: string) => void
}

export function matchesSearch(text: string, term: string): boolean {
  if (!term) return false
  return text.toLowerCase().includes(term.toLowerCase())
}

export function HighlightText({
  text,
  searchTerm,
}: {
  readonly text: string
  readonly searchTerm: string
}) {
  if (!searchTerm) return <>{text}</>

  const lower = text.toLowerCase()
  const termLower = searchTerm.toLowerCase()
  const idx = lower.indexOf(termLower)

  if (idx === -1) return <>{text}</>

  const before = text.slice(0, idx)
  const match = text.slice(idx, idx + searchTerm.length)
  const after = text.slice(idx + searchTerm.length)

  return (
    <>
      {before}
      <span className="bg-yellow-500/30 text-yellow-200 rounded px-0.5">
        {match}
      </span>
      {after}
    </>
  )
}

export function CopyButton({
  path,
  onCopy,
}: {
  readonly path: string
  readonly onCopy: (path: string) => void
}) {
  const [copied, setCopied] = useState(false)

  function handleClick(e: React.MouseEvent) {
    e.stopPropagation()
    onCopy(path)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        'inline-flex items-center opacity-0 group-hover/node:opacity-100',
        'transition-opacity ml-2 text-slate-500 hover:text-slate-300'
      )}
      title={`Copy path: ${path}`}
    >
      {copied ? (
        <Check className="h-3 w-3 text-green-400" />
      ) : (
        <Copy className="h-3 w-3" />
      )}
    </button>
  )
}

function KeyLabel({
  keyName,
  searchTerm,
}: {
  readonly keyName: string
  readonly searchTerm: string
}) {
  return (
    <span className={cn(
      'text-slate-300 mr-1',
      matchesSearch(keyName, searchTerm) && 'bg-yellow-500/30 rounded px-0.5'
    )}>
      <HighlightText text={keyName} searchTerm={searchTerm} />
      <span className="text-slate-500">: </span>
    </span>
  )
}

const ROW_CLASS = 'group/node flex items-center py-0.5 hover:bg-slate-800/50 rounded px-1'

export function NullNode({ path, keyName, searchTerm, onPathCopy }: NodeProps) {
  return (
    <div className={ROW_CLASS}>
      {keyName !== undefined && (
        <KeyLabel keyName={keyName} searchTerm={searchTerm} />
      )}
      <span className="text-slate-500 italic">null</span>
      <CopyButton path={path} onCopy={onPathCopy} />
    </div>
  )
}

export function StringNode({
  value,
  ...rest
}: NodeProps & { readonly value: string }) {
  const displayValue = value.length > 200
    ? value.slice(0, 200) + '...'
    : value

  return (
    <div className={ROW_CLASS}>
      {rest.keyName !== undefined && (
        <KeyLabel keyName={rest.keyName} searchTerm={rest.searchTerm} />
      )}
      <span className={cn(
        'text-green-400',
        matchesSearch(displayValue, rest.searchTerm)
          && 'bg-yellow-500/30 rounded px-0.5'
      )}>
        &quot;
        <HighlightText text={displayValue} searchTerm={rest.searchTerm} />
        &quot;
      </span>
      <CopyButton path={rest.path} onCopy={rest.onPathCopy} />
    </div>
  )
}

export function NumberNode({
  value,
  ...rest
}: NodeProps & { readonly value: number }) {
  const str = String(value)

  return (
    <div className={ROW_CLASS}>
      {rest.keyName !== undefined && (
        <KeyLabel keyName={rest.keyName} searchTerm={rest.searchTerm} />
      )}
      <span className={cn(
        'text-blue-400',
        matchesSearch(str, rest.searchTerm) && 'bg-yellow-500/30 rounded px-0.5'
      )}>
        <HighlightText text={str} searchTerm={rest.searchTerm} />
      </span>
      <CopyButton path={rest.path} onCopy={rest.onPathCopy} />
    </div>
  )
}

export function BoolNode({
  value,
  ...rest
}: NodeProps & { readonly value: boolean }) {
  const str = String(value)

  return (
    <div className={ROW_CLASS}>
      {rest.keyName !== undefined && (
        <KeyLabel keyName={rest.keyName} searchTerm={rest.searchTerm} />
      )}
      <span className={cn(
        'text-purple-400',
        matchesSearch(str, rest.searchTerm) && 'bg-yellow-500/30 rounded px-0.5'
      )}>
        <HighlightText text={str} searchTerm={rest.searchTerm} />
      </span>
      <CopyButton path={rest.path} onCopy={rest.onPathCopy} />
    </div>
  )
}
