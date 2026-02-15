'use client'

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Plus, FolderKanban } from 'lucide-react'
import { ProjectRow } from '@/components/settings/project-row'

type Project = {
  id: string
  name: string
  url: string | null
  createdAt: string | null
}

function generateId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  const segments = [8, 4, 4]
  return segments
    .map((len) =>
      Array.from({ length: len }, () =>
        chars[Math.floor(Math.random() * chars.length)]
      ).join('')
    )
    .join('-')
}

export default function ProjectSettingsPage() {
  const [projects, setProjects] = useState<Project[] | null>(null)
  const loading = projects === null
  const [dialogOpen, setDialogOpen] = useState(false)

  const [newProject, setNewProject] = useState({
    name: '',
    url: '',
  })

  const fetchProjects = useCallback(async () => {
    const res = await fetch('/api/projects')
    const data = await res.json()
    setProjects(data)
  }, [])

  /* eslint-disable react-hooks/set-state-in-effect -- async data fetching */
  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])
  /* eslint-enable react-hooks/set-state-in-effect */

  async function handleCreate() {
    if (!newProject.name) return

    const id = generateId()

    await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        name: newProject.name,
        url: newProject.url || null,
      }),
    })

    setNewProject({ name: '', url: '' })
    setDialogOpen(false)
    fetchProjects()
  }

  async function handleUpdate(
    id: string,
    name: string,
    url: string
  ) {
    await fetch(`/api/projects/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, url: url || null }),
    })
    fetchProjects()
  }

  async function handleDelete(id: string) {
    await fetch(`/api/projects/${id}`, { method: 'DELETE' })
    fetchProjects()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Loading projects...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Manage your registered projects and widget installation snippets.
        </p>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4" />
              Add Project
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>New Project</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={newProject.name}
                  onChange={(e) =>
                    setNewProject({ ...newProject, name: e.target.value })
                  }
                  placeholder="My App"
                  className="bg-background border-border"
                />
              </div>
              <div className="space-y-2">
                <Label>URL (optional)</Label>
                <Input
                  value={newProject.url}
                  onChange={(e) =>
                    setNewProject({ ...newProject, url: e.target.value })
                  }
                  placeholder="https://myapp.com"
                  className="bg-background border-border"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={!newProject.name}
              >
                Create Project
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {(projects ?? []).length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <FolderKanban className="h-10 w-10 mx-auto mb-3 opacity-50" />
          <p>No projects yet</p>
          <p className="text-xs mt-1">
            Click &quot;Add Project&quot; to register your first project.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {(projects ?? []).map((project) => (
            <ProjectRow
              key={project.id}
              project={project}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}
