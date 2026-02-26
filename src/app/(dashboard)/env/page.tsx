'use client'

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, KeyRound } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { EnvVarList } from '@/components/env/env-var-list'
import { EnvCompare } from '@/components/env/env-compare'
import { EnvImport } from '@/components/env/env-import'
import type { EnvVar, Project } from '@/components/env/types'

export default function EnvVarsPage() {
  const [envVars, setEnvVars] = useState<EnvVar[] | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const loading = envVars === null
  const [filterProjectId, setFilterProjectId] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)

  const [newVar, setNewVar] = useState({
    projectId: '',
    key: '',
    value: '',
    sensitive: false,
    description: '',
  })

  const fetchEnvVars = useCallback(async () => {
    const params = filterProjectId
      ? `?projectId=${filterProjectId}`
      : ''
    const res = await fetch(`/api/env${params}`)
    const data = await res.json()
    setEnvVars(data)
  }, [filterProjectId])

  const fetchProjects = useCallback(async () => {
    const res = await fetch('/api/projects')
    const data = await res.json()
    setProjects(data)
  }, [])

  /* eslint-disable react-hooks/set-state-in-effect -- async data fetching */
  useEffect(() => {
    fetchEnvVars()
    fetchProjects()
  }, [fetchEnvVars, fetchProjects])
  /* eslint-enable react-hooks/set-state-in-effect */

  async function handleCreate() {
    if (!newVar.projectId || !newVar.key || !newVar.value) return

    await fetch('/api/env', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...newVar,
        description: newVar.description || null,
      }),
    })

    setNewVar({
      projectId: '',
      key: '',
      value: '',
      sensitive: false,
      description: '',
    })
    setDialogOpen(false)
    toast.success('Variable added')
    fetchEnvVars()
  }

  async function handleDelete(id: number) {
    await fetch(`/api/env?id=${id}`, { method: 'DELETE' })
    toast.success('Variable deleted')
    fetchEnvVars()
  }

  async function handleUpdate(
    id: number,
    data: { value?: string; description?: string | null }
  ) {
    try {
      const res = await fetch('/api/env', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...data }),
      })
      if (!res.ok) throw new Error('Failed to update')
      toast.success('Variable updated')
      fetchEnvVars()
    } catch {
      toast.error('Failed to update variable')
    }
  }

  async function handleBulkImport(
    projectId: string,
    vars: Array<{ key: string; value: string }>,
    sensitive: boolean
  ) {
    await Promise.all(
      vars.map((v) =>
        fetch('/api/env', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId,
            key: v.key,
            value: v.value,
            sensitive,
          }),
        })
      )
    )
    toast.success(`Imported ${vars.length} variable${vars.length !== 1 ? 's' : ''}`)
    fetchEnvVars()
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-7 w-28" />
        </div>
        <Skeleton className="h-4 w-80" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-xl font-bold">Env Vars</h1>
          <Badge variant="secondary" className="text-xs">
            {(envVars ?? []).length}
          </Badge>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4" />
              Add Variable
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>Add Environment Variable</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Project</Label>
                <select
                  value={newVar.projectId}
                  onChange={(e) =>
                    setNewVar({ ...newVar, projectId: e.target.value })
                  }
                  className={cn(
                    'w-full h-9 rounded-md border border-border',
                    'bg-background text-foreground text-sm px-3',
                    'focus:outline-none focus:ring-2 focus:ring-ring'
                  )}
                >
                  <option value="">Select a project</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label>Key</Label>
                <Input
                  value={newVar.key}
                  onChange={(e) =>
                    setNewVar({
                      ...newVar,
                      key: e.target.value.toUpperCase(),
                    })
                  }
                  placeholder="e.g. DATABASE_URL"
                  className="bg-background border-border font-mono"
                />
              </div>

              <div className="space-y-2">
                <Label>Value</Label>
                <Input
                  value={newVar.value}
                  onChange={(e) =>
                    setNewVar({ ...newVar, value: e.target.value })
                  }
                  placeholder="e.g. postgres://..."
                  type={newVar.sensitive ? 'password' : 'text'}
                  className="bg-background border-border font-mono"
                />
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={newVar.sensitive}
                  onCheckedChange={(checked) =>
                    setNewVar({ ...newVar, sensitive: checked })
                  }
                />
                <Label className="text-sm text-muted-foreground">
                  Sensitive value (masked by default)
                </Label>
              </div>

              <div className="space-y-2">
                <Label>Description (optional)</Label>
                <Input
                  value={newVar.description}
                  onChange={(e) =>
                    setNewVar({
                      ...newVar,
                      description: e.target.value,
                    })
                  }
                  placeholder="What is this variable for?"
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
                disabled={
                  !newVar.projectId || !newVar.key || !newVar.value
                }
              >
                Add Variable
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <p className="text-sm text-muted-foreground">
        Store and compare environment variables across projects. Use the
        Import tab to bulk-load from .env files. Variables marked sensitive
        are masked by default.
      </p>

      {/* Tabs */}
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Variables</TabsTrigger>
          <TabsTrigger value="compare">Compare</TabsTrigger>
          <TabsTrigger value="import">Import</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <EnvVarList
            envVars={envVars ?? []}
            projects={projects}
            filterProjectId={filterProjectId}
            onFilterChange={(id) => setFilterProjectId(id)}
            onDelete={handleDelete}
            onUpdate={handleUpdate}
          />
        </TabsContent>

        <TabsContent value="compare">
          <EnvCompare envVars={envVars ?? []} projects={projects} />
        </TabsContent>

        <TabsContent value="import">
          <EnvImport
            projects={projects}
            onImport={handleBulkImport}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
