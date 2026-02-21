'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, Trash2, ChevronRight } from 'lucide-react'
import { ChecklistEditor } from './checklist-editor'

interface Project { id: string; name: string }
interface Checklist { id: number; projectId: string; name: string; description?: string | null; sortOrder: number }

export function RoutinesClient() {
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const [checklists, setChecklists] = useState<Checklist[]>([])
  const [selectedChecklist, setSelectedChecklist] = useState<Checklist | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/projects').then((r) => r.json()).then((data: Project[]) => {
      setProjects(data)
      if (data.length > 0) setSelectedProject(data[0].id)
    }).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!selectedProject) return
    setSelectedChecklist(null)
    fetch(`/api/routines?projectId=${selectedProject}`).then((r) => r.json()).then(setChecklists)
  }, [selectedProject])

  async function createChecklist() {
    const name = prompt('Checklist name:')
    if (!name || !selectedProject) return
    const res = await fetch('/api/routines', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: selectedProject, name }),
    })
    if (res.ok) {
      const row: Checklist = await res.json()
      setChecklists((prev) => [...prev, row])
      setSelectedChecklist(row)
    }
  }

  async function deleteChecklist(id: number) {
    if (!confirm('Delete this checklist and all its items?')) return
    await fetch(`/api/routines/${id}`, { method: 'DELETE' })
    setChecklists((prev) => prev.filter((c) => c.id !== id))
    if (selectedChecklist?.id === id) setSelectedChecklist(null)
  }

  if (loading) return <div className="p-6 text-sm text-muted-foreground">Loading...</div>

  return (
    <div className="flex h-full">
      <div className="w-64 border-r border-border flex flex-col">
        <div className="p-3 border-b border-border">
          <select
            className="w-full text-sm bg-background border border-border rounded px-2 py-1"
            value={selectedProject ?? ''}
            onChange={(e) => setSelectedProject(e.target.value)}
          >
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div className="flex-1 overflow-auto p-2">
          {checklists.map((c) => (
            <div
              key={c.id}
              className={`flex items-center justify-between px-3 py-2 rounded-md cursor-pointer text-sm group ${
                selectedChecklist?.id === c.id ? 'bg-accent text-foreground' : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
              }`}
              onClick={() => setSelectedChecklist(c)}
            >
              <span className="flex items-center gap-1 min-w-0 truncate">
                <ChevronRight className="h-3 w-3 opacity-50 shrink-0" />{c.name}
              </span>
              <button
                className="opacity-0 group-hover:opacity-100 text-destructive shrink-0 ml-1"
                onClick={(e) => { e.stopPropagation(); deleteChecklist(c.id) }}
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
          {checklists.length === 0 && <p className="text-xs text-muted-foreground px-3 py-2">No checklists yet</p>}
        </div>
        <div className="p-3 border-t border-border">
          <Button size="sm" variant="outline" className="w-full" onClick={createChecklist}>
            <Plus className="h-3 w-3 mr-1" /> New Checklist
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-6">
        {selectedChecklist ? (
          <ChecklistEditor checklist={selectedChecklist} onUpdate={(c) => {
            setChecklists((prev) => prev.map((x) => x.id === c.id ? c : x))
            setSelectedChecklist(c)
          }} />
        ) : (
          <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
            Select a checklist or create one
          </div>
        )}
      </div>
    </div>
  )
}
