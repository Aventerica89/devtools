'use client'

import { useEffect, useState, useCallback } from 'react'
import { cn } from '@/lib/utils'

interface Bug {
  id: number
  title: string
  severity: string | null
  status: string | null
  pageUrl: string | null
  stackTrace: string | null
  createdAt: string | null
}

interface Idea {
  id: number
  title: string
  status: string | null
  createdAt: string | null
}

interface DevToolsProjectPanelProps {
  projectId: string
  apiBase: string
  apiKey: string
}

const SEVERITY_STYLES: Record<string, string> = {
  critical: 'bg-red-900/50 text-red-300 border-red-700',
  high: 'bg-orange-900/50 text-orange-300 border-orange-700',
  medium: 'bg-yellow-900/50 text-yellow-300 border-yellow-700',
  low: 'bg-blue-900/50 text-blue-300 border-blue-700',
}

function buildClaudeContext(
  projectId: string,
  bugs: Bug[],
  ideas: Idea[]
): string {
  const date = new Date().toISOString().slice(0, 10)
  const openBugs = bugs.filter(
    (b) => b.status === 'open' || b.status === 'in-progress'
  )
  const openIdeas = ideas.filter((i) => i.status !== 'done')

  const bugLines = openBugs.map((b) => {
    let line = `- [ ] [${(b.severity ?? 'medium').toUpperCase()}] ${b.title}`
    if (b.pageUrl) line += `\n      Page: ${b.pageUrl}`
    if (b.stackTrace) line += `\n      Stack: ${b.stackTrace.slice(0, 120)}...`
    return line
  })

  const ideaLines = openIdeas.map((i) => {
    const prefix =
      i.status === 'in-progress' ? '- [ ] (in-progress)' : '- [ ]'
    return `${prefix} ${i.title}`
  })

  const sections: string[] = [
    `## Project: ${projectId} \u2014 Open Items (${date})`,
    '',
    `### Bugs (${openBugs.length} open)`,
    ...bugLines,
    '',
    `### Ideas (${openIdeas.length})`,
    ...ideaLines,
  ]
  return sections.join('\n')
}

export function DevToolsProjectPanel({
  projectId,
  apiBase,
  apiKey,
}: DevToolsProjectPanelProps) {
  const [bugs, setBugs] = useState<Bug[]>([])
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedBug, setExpandedBug] = useState<number | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const headers = { 'x-devtools-api-key': apiKey }

  useEffect(() => {
    setLoading(true)
    Promise.all([
      fetch(`${apiBase}/api/bugs?project=${projectId}&status=open`, {
        headers,
      }).then((r) => r.json()),
      fetch(`${apiBase}/api/ideas?projectId=${projectId}`, {
        headers,
      }).then((r) => r.json()),
    ])
      .then(([bugList, ideaList]) => {
        setBugs(bugList ?? [])
        setIdeas(ideaList ?? [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [projectId, apiBase, apiKey])

  const copyText = useCallback(
    (text: string, key: string) => {
      navigator.clipboard
        ?.writeText(text)
        .then(() => {
          setCopiedId(key)
          setTimeout(() => setCopiedId(null), 2000)
        })
        .catch(() => {})
    },
    []
  )

  if (loading) {
    return (
      <div className="text-sm text-muted-foreground py-4">
        Loading\u2026
      </div>
    )
  }

  const openBugs = bugs.filter(
    (b) => b.status === 'open' || b.status === 'in-progress'
  )
  const openIdeas = ideas.filter((i) => i.status !== 'done')

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium">
            Bugs{' '}
            <span className="text-muted-foreground">
              ({openBugs.length} open)
            </span>
          </h3>
          <button
            onClick={() =>
              copyText(buildClaudeContext(projectId, bugs, []), 'bugs')
            }
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            {copiedId === 'bugs' ? 'Copied!' : 'Copy bugs for Claude'}
          </button>
        </div>
        <div className="space-y-2">
          {openBugs.length === 0 ? (
            <p className="text-xs text-muted-foreground">No open bugs.</p>
          ) : (
            openBugs.map((bug) => (
              <div
                key={bug.id}
                className="rounded-md border border-border p-3 text-sm"
              >
                <div className="flex items-start gap-2">
                  <span
                    className={cn(
                      'text-xs px-1.5 py-0.5 rounded border shrink-0 capitalize',
                      SEVERITY_STYLES[bug.severity ?? 'medium']
                    )}
                  >
                    {bug.severity ?? 'medium'}
                  </span>
                  <span className="flex-1">{bug.title}</span>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() =>
                        copyText(
                          `[${(bug.severity ?? 'medium').toUpperCase()}] ${bug.title}${bug.pageUrl ? '\nPage: ' + bug.pageUrl : ''}${bug.stackTrace ? '\nStack: ' + bug.stackTrace.slice(0, 200) : ''}`,
                          `bug-${bug.id}`
                        )
                      }
                      className="text-xs text-muted-foreground hover:text-foreground px-1"
                    >
                      {copiedId === `bug-${bug.id}` ? '\u2713' : 'Copy'}
                    </button>
                    {bug.stackTrace && (
                      <button
                        onClick={() =>
                          setExpandedBug(
                            expandedBug === bug.id ? null : bug.id
                          )
                        }
                        className="text-xs text-muted-foreground hover:text-foreground px-1"
                      >
                        {expandedBug === bug.id ? '\u25b2' : '\u25bc'}
                      </button>
                    )}
                  </div>
                </div>
                {bug.pageUrl && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {bug.pageUrl}
                  </p>
                )}
                {expandedBug === bug.id && bug.stackTrace && (
                  <pre className="mt-2 text-xs text-muted-foreground whitespace-pre-wrap bg-muted/30 rounded p-2 overflow-auto max-h-40">
                    {bug.stackTrace}
                  </pre>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium">
            Ideas{' '}
            <span className="text-muted-foreground">
              ({openIdeas.length} active)
            </span>
          </h3>
          <button
            onClick={() =>
              copyText(buildClaudeContext(projectId, [], ideas), 'ideas')
            }
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            {copiedId === 'ideas' ? 'Copied!' : 'Copy ideas for Claude'}
          </button>
        </div>
        <div className="space-y-1">
          {openIdeas.length === 0 ? (
            <p className="text-xs text-muted-foreground">No active ideas.</p>
          ) : (
            openIdeas.map((idea) => (
              <div
                key={idea.id}
                className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-muted/30 group"
              >
                <span
                  className={cn(
                    'text-xs w-20 shrink-0',
                    idea.status === 'in-progress'
                      ? 'text-indigo-400'
                      : 'text-muted-foreground'
                  )}
                >
                  {idea.status}
                </span>
                <span className="flex-1 text-sm">{idea.title}</span>
                <button
                  onClick={() => copyText(idea.title, `idea-${idea.id}`)}
                  className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-foreground px-1"
                >
                  {copiedId === `idea-${idea.id}` ? '\u2713' : 'Copy'}
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <button
        onClick={() =>
          copyText(buildClaudeContext(projectId, bugs, ideas), 'all')
        }
        className="w-full py-2 rounded-md border border-border text-sm text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
      >
        {copiedId === 'all' ? '\u2713 Copied!' : 'Copy all for Claude'}
      </button>
    </div>
  )
}
