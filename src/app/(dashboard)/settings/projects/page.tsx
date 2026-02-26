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
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { ProjectRow } from '@/components/settings/project-row'

type Project = {
  id: string
  name: string
  url: string | null
  platform: string | null
  platformId: string | null
  createdAt: string | null
}

const PLATFORMS = [
  { value: '', label: 'None' },
  { value: 'vercel', label: 'Vercel' },
  { value: 'cloudflare-workers', label: 'CF Workers' },
  { value: 'cloudflare-pages', label: 'CF Pages' },
  { value: 'github', label: 'GitHub Actions' },
] as const

const PLATFORM_HINTS: Record<string, string> = {
  vercel: 'Vercel project ID (e.g. prj_abc123)',
  'cloudflare-workers': 'Worker script name (e.g. vaporforge)',
  'cloudflare-pages': 'Pages project name (e.g. my-site)',
  github: 'owner/repo (e.g. Aventerica89/devtools)',
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
    platform: '',
    platformId: '',
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

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          name: newProject.name,
          url: newProject.url || null,
          platform: newProject.platform || null,
          platformId: newProject.platformId || null,
        }),
      })
      if (!res.ok) throw new Error('Failed to create')
      toast.success('Project created')
    } catch {
      toast.error('Failed to create project')
    }

    setNewProject({ name: '', url: '', platform: '', platformId: '' })
    setDialogOpen(false)
    fetchProjects()
  }

  async function handleUpdate(
    id: string,
    data: {
      name: string
      url: string
      platform: string | null
      platformId: string | null
    }
  ) {
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          url: data.url || null,
          platform: data.platform,
          platformId: data.platformId,
        }),
      })
      if (!res.ok) throw new Error('Failed to update')
      toast.success('Project updated')
    } catch {
      toast.error('Failed to update project')
    }
    fetchProjects()
  }

  async function handleDelete(id: string) {
    try {
      await fetch(`/api/projects/${id}`, { method: 'DELETE' })
      toast.success('Project deleted')
    } catch {
      toast.error('Failed to delete project')
    }
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
          Manage projects, widget snippets, and deployment platform config.
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
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Deploy Platform</Label>
                  <select
                    value={newProject.platform}
                    onChange={(e) =>
                      setNewProject({
                        ...newProject,
                        platform: e.target.value,
                        platformId: e.target.value
                          ? newProject.platformId
                          : '',
                      })
                    }
                    className={cn(
                      'w-full h-9 rounded-md border border-border',
                      'bg-background text-foreground text-sm px-3',
                      'focus:outline-none focus:ring-2 focus:ring-ring'
                    )}
                  >
                    {PLATFORMS.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Platform ID</Label>
                  <Input
                    value={newProject.platformId}
                    onChange={(e) =>
                      setNewProject({
                        ...newProject,
                        platformId: e.target.value,
                      })
                    }
                    placeholder={
                      PLATFORM_HINTS[newProject.platform] ??
                      'Select a platform first'
                    }
                    disabled={!newProject.platform}
                    className="bg-background border-border"
                  />
                </div>
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
