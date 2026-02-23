'use client'

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Lightbulb, Plus, Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

type Idea = {
  id: number
  projectId: string
  title: string
  body: string | null
  status: string | null
  createdAt: string | null
}

type Project = { id: string; name: string }

const STATUS_STYLES: Record<string, string> = {
  'idea': 'bg-slate-800 text-slate-300 border-slate-600',
  'in-progress': 'bg-indigo-900/50 text-indigo-300 border-indigo-700',
  'done': 'bg-emerald-900/50 text-emerald-300 border-emerald-700',
}

const STATUS_CYCLE: Record<string, string> = {
  'idea': 'in-progress',
  'in-progress': 'done',
  'done': 'idea',
}

export default function IdeasPage() {
  const [ideas, setIdeas] = useState<Idea[] | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [filter, setFilter] = useState<string>('all')
  const [projectFilter, setProjectFilter] = useState<string>('all')
  const [newTitle, setNewTitle] = useState('')
  const [newProject, setNewProject] = useState('')
  const [adding, setAdding] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/ideas').then((r) => r.json()),
      fetch('/api/projects').then((r) => r.json()),
    ]).then(([ideaList, projectList]) => {
      setIdeas(ideaList)
      setProjects(projectList)
      if (projectList.length > 0) setNewProject(projectList[0].id)
    }).catch(() => { setIdeas([]) })
  }, [])

  const visible = (ideas ?? []).filter((i) => {
    if (filter !== 'all' && i.status !== filter) return false
    if (projectFilter !== 'all' && i.projectId !== projectFilter) return false
    return true
  })

  const handleAdd = useCallback(async () => {
    if (!newTitle.trim() || !newProject || adding) return
    setAdding(true)
    try {
      const res = await fetch('/api/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: newProject, title: newTitle.trim() }),
      })
      if (!res.ok) return
      const created: Idea = await res.json()
      setIdeas((prev) => [created, ...(prev ?? [])])
      setNewTitle('')
    } finally {
      setAdding(false)
    }
  }, [newTitle, newProject, adding])

  const cycleStatus = useCallback(async (idea: Idea) => {
    const next = STATUS_CYCLE[idea.status ?? 'idea']
    setIdeas((prev) =>
      (prev ?? []).map((i) => (i.id === idea.id ? { ...i, status: next } : i))
    )
    await fetch(`/api/ideas/${idea.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    }).catch(() => {})
  }, [])

  const deleteIdea = useCallback(async (id: number) => {
    setIdeas((prev) => (prev ?? []).filter((i) => i.id !== id))
    await fetch(`/api/ideas/${id}`, { method: 'DELETE' }).catch(() => {})
  }, [])

  const copyForClaude = useCallback(() => {
    const open = (ideas ?? []).filter((i) => i.status !== 'done')
    const byProject: Record<string, Idea[]> = {}
    for (const idea of open) {
      byProject[idea.projectId] = [
        ...(byProject[idea.projectId] ?? []),
        idea,
      ]
    }
    const lines = Object.entries(byProject).flatMap(([pid, items]) => [
      `### Ideas \u2014 ${pid}`,
      ...items.map((i) =>
        `- [ ] ${i.status === 'in-progress' ? '(in-progress) ' : ''}${i.title}`
      ),
    ])
    navigator.clipboard?.writeText(lines.join('\n')).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {})
  }, [ideas])

  const STATUSES = ['all', 'idea', 'in-progress', 'done']

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-xl font-semibold">Ideas</h1>
          <Badge variant="outline">
            {(ideas ?? []).filter((i) => i.status !== 'done').length} open
          </Badge>
        </div>
        <Button variant="outline" size="sm" onClick={copyForClaude}>
          {copied
            ? <Check className="h-4 w-4 mr-1" />
            : <Copy className="h-4 w-4 mr-1" />}
          {copied ? 'Copied!' : 'Copy for Claude'}
        </Button>
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="New idea\u2026"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          className="flex-1"
        />
        <select
          value={newProject}
          onChange={(e) => setNewProject(e.target.value)}
          className="px-3 py-2 rounded-md border border-border bg-background text-sm"
        >
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <Button onClick={handleAdd} disabled={adding} size="sm">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={cn(
              'px-3 py-1 rounded-full text-xs border transition-colors capitalize',
              filter === s
                ? 'bg-indigo-600 border-indigo-600 text-white'
                : 'border-border text-muted-foreground hover:border-foreground'
            )}
          >
            {s}
          </button>
        ))}
        {projects.length > 1 && (
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="px-3 py-1 rounded-full text-xs border border-border bg-background ml-auto"
          >
            <option value="all">All projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        )}
      </div>

      <div className="space-y-2">
        {ideas === null ? (
          <p className="text-muted-foreground text-sm">Loading\u2026</p>
        ) : visible.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No ideas match the filter.
          </p>
        ) : visible.map((idea) => (
          <div
            key={idea.id}
            className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card"
          >
            <button
              onClick={() => cycleStatus(idea)}
              className={cn(
                'text-xs px-2 py-0.5 rounded border capitalize shrink-0 mt-0.5',
                STATUS_STYLES[idea.status ?? 'idea']
              )}
            >
              {idea.status ?? 'idea'}
            </button>
            <span
              className={cn(
                'flex-1 text-sm',
                idea.status === 'done' && 'line-through text-muted-foreground'
              )}
            >
              {idea.title}
            </span>
            <span className="text-xs text-muted-foreground shrink-0">
              {idea.projectId}
            </span>
            <button
              onClick={() => deleteIdea(idea.id)}
              className="text-muted-foreground hover:text-destructive text-xs shrink-0"
            >
              \u00d7
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
