'use client'

import { useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { ChevronRight, ChevronDown } from 'lucide-react'
import {
  type JsonValue,
  matchesSearch,
  HighlightText,
  CopyButton,
  NullNode,
  StringNode,
  NumberNode,
  BoolNode,
} from '@/components/json-tree-node'

type JsonTreeProps = {
  readonly data: JsonValue
  readonly searchTerm?: string
  readonly expandAll?: boolean
  readonly onPathCopy?: (path: string) => void
}

type JsonNodeProps = {
  readonly data: JsonValue
  readonly path: string
  readonly depth: number
  readonly searchTerm: string
  readonly expandAll: boolean
  readonly onPathCopy: (path: string) => void
  readonly keyName?: string
}

function ArrayNode({
  data,
  path,
  depth,
  keyName,
  searchTerm,
  expandAll,
  onPathCopy,
}: {
  readonly data: JsonValue[]
  readonly path: string
  readonly depth: number
  readonly keyName?: string
  readonly searchTerm: string
  readonly expandAll: boolean
  readonly onPathCopy: (path: string) => void
}) {
  const [expanded, setExpanded] = useState(depth < 2)
  const isExpanded = expandAll || expanded

  return (
    <div>
      <div
        className={cn(
          'group/node flex items-center py-0.5 cursor-pointer',
          'hover:bg-slate-800/50 rounded px-1'
        )}
        onClick={() => setExpanded(!expanded)}
      >
        {isExpanded ? (
          <ChevronDown className="h-3.5 w-3.5 text-slate-500 shrink-0" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-slate-500 shrink-0" />
        )}
        {keyName !== undefined && (
          <span className={cn(
            'text-slate-300 ml-1 mr-1',
            matchesSearch(keyName, searchTerm)
              && 'bg-yellow-500/30 rounded px-0.5'
          )}>
            <HighlightText text={keyName} searchTerm={searchTerm} />
            <span className="text-slate-500">: </span>
          </span>
        )}
        <span className="text-slate-500 text-xs">
          [{data.length} {data.length === 1 ? 'item' : 'items'}]
        </span>
        <CopyButton path={path} onCopy={onPathCopy} />
      </div>
      {isExpanded && (
        <div className="ml-4 border-l border-slate-800 pl-2">
          {data.map((item, index) => (
            <JsonNode
              key={index}
              data={item}
              path={`${path}[${index}]`}
              depth={depth + 1}
              keyName={String(index)}
              searchTerm={searchTerm}
              expandAll={expandAll}
              onPathCopy={onPathCopy}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function ObjectNode({
  data,
  path,
  depth,
  keyName,
  searchTerm,
  expandAll,
  onPathCopy,
}: {
  readonly data: Record<string, JsonValue>
  readonly path: string
  readonly depth: number
  readonly keyName?: string
  readonly searchTerm: string
  readonly expandAll: boolean
  readonly onPathCopy: (path: string) => void
}) {
  const [expanded, setExpanded] = useState(depth < 2)
  const keys = Object.keys(data)
  const isExpanded = expandAll || expanded

  return (
    <div>
      <div
        className={cn(
          'group/node flex items-center py-0.5 cursor-pointer',
          'hover:bg-slate-800/50 rounded px-1'
        )}
        onClick={() => setExpanded(!expanded)}
      >
        {isExpanded ? (
          <ChevronDown className="h-3.5 w-3.5 text-slate-500 shrink-0" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-slate-500 shrink-0" />
        )}
        {keyName !== undefined && (
          <span className={cn(
            'text-slate-300 ml-1 mr-1',
            matchesSearch(keyName, searchTerm)
              && 'bg-yellow-500/30 rounded px-0.5'
          )}>
            <HighlightText text={keyName} searchTerm={searchTerm} />
            <span className="text-slate-500">: </span>
          </span>
        )}
        <span className="text-slate-500 text-xs">
          {'{'}
          {keys.length} {keys.length === 1 ? 'key' : 'keys'}
          {'}'}
        </span>
        <CopyButton path={path} onCopy={onPathCopy} />
      </div>
      {isExpanded && (
        <div className="ml-4 border-l border-slate-800 pl-2">
          {keys.map((key) => {
            const childPath = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key)
              ? (path ? `${path}.${key}` : key)
              : (path ? `${path}["${key}"]` : `["${key}"]`)

            return (
              <JsonNode
                key={key}
                data={data[key]}
                path={childPath}
                depth={depth + 1}
                keyName={key}
                searchTerm={searchTerm}
                expandAll={expandAll}
                onPathCopy={onPathCopy}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

function JsonNode({
  data,
  path,
  depth,
  keyName,
  searchTerm,
  expandAll,
  onPathCopy,
}: JsonNodeProps) {
  if (data === null) {
    return (
      <NullNode
        path={path}
        keyName={keyName}
        searchTerm={searchTerm}
        onPathCopy={onPathCopy}
      />
    )
  }

  if (typeof data === 'string') {
    return (
      <StringNode
        value={data}
        path={path}
        keyName={keyName}
        searchTerm={searchTerm}
        onPathCopy={onPathCopy}
      />
    )
  }

  if (typeof data === 'number') {
    return (
      <NumberNode
        value={data}
        path={path}
        keyName={keyName}
        searchTerm={searchTerm}
        onPathCopy={onPathCopy}
      />
    )
  }

  if (typeof data === 'boolean') {
    return (
      <BoolNode
        value={data}
        path={path}
        keyName={keyName}
        searchTerm={searchTerm}
        onPathCopy={onPathCopy}
      />
    )
  }

  if (Array.isArray(data)) {
    return (
      <ArrayNode
        data={data}
        path={path}
        depth={depth}
        keyName={keyName}
        searchTerm={searchTerm}
        expandAll={expandAll}
        onPathCopy={onPathCopy}
      />
    )
  }

  return (
    <ObjectNode
      data={data as Record<string, JsonValue>}
      path={path}
      depth={depth}
      keyName={keyName}
      searchTerm={searchTerm}
      expandAll={expandAll}
      onPathCopy={onPathCopy}
    />
  )
}

export function JsonTree({ data, searchTerm, expandAll, onPathCopy }: JsonTreeProps) {
  const handlePathCopy = useCallback(
    (path: string) => {
      navigator.clipboard.writeText(path)
      onPathCopy?.(path)
    },
    [onPathCopy]
  )

  return (
    <div className="font-mono text-sm">
      <JsonNode
        data={data}
        path=""
        depth={0}
        searchTerm={searchTerm ?? ''}
        expandAll={expandAll ?? false}
        onPathCopy={handlePathCopy}
      />
    </div>
  )
}
