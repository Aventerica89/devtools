'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Check, Copy, Pencil, Trash2, X } from 'lucide-react'
import { cn } from '@/lib/utils'

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

const PLATFORM_BADGE_STYLES: Record<string, string> = {
  vercel: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'cloudflare-workers': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  'cloudflare-pages': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  github: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
}

type Project = {
  id: string
  name: string
  url: string | null
  platform: string | null
  platformId: string | null
  createdAt: string | null
}

type ProjectRowProps = {
  readonly project: Project
  readonly onUpdate: (
    id: string,
    data: {
      name: string
      url: string
      platform: string | null
      platformId: string | null
    }
  ) => Promise<void>
  readonly onDelete: (id: string) => Promise<void>
}

export function ProjectRow({ project, onUpdate, onDelete }: ProjectRowProps) {
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(project.name)
  const [editUrl, setEditUrl] = useState(project.url ?? '')
  const [editPlatform, setEditPlatform] = useState(project.platform ?? '')
  const [editPlatformId, setEditPlatformId] = useState(
    project.platformId ?? ''
  )
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const snippet = [
    '<script src="https://devtools.jbcloud.app/widget.js"',
    `        data-project="${project.id}"`,
    '        data-pin="YOUR_PIN_HASH"></script>',
  ].join('\n')

  async function handleSaveEdit() {
    await onUpdate(project.id, {
      name: editName,
      url: editUrl,
      platform: editPlatform || null,
      platformId: editPlatformId || null,
    })
    setEditing(false)
  }

  function handleCancelEdit() {
    setEditName(project.name)
    setEditUrl(project.url ?? '')
    setEditPlatform(project.platform ?? '')
    setEditPlatformId(project.platformId ?? '')
    setEditing(false)
  }

  async function handleCopySnippet() {
    await navigator.clipboard.writeText(snippet)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const platformLabel = PLATFORMS.find(
    (p) => p.value === project.platform
  )?.label

  return (
    <div className="border border-border rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between gap-4">
        {editing ? (
          <div className="flex-1 space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Name</Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Project name"
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">URL (optional)</Label>
              <Input
                value={editUrl}
                onChange={(e) => setEditUrl(e.target.value)}
                placeholder="https://example.com"
                className="bg-background border-border"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Deploy Platform</Label>
                <select
                  value={editPlatform}
                  onChange={(e) => {
                    setEditPlatform(e.target.value)
                    if (!e.target.value) setEditPlatformId('')
                  }}
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
              <div className="space-y-1">
                <Label className="text-xs">Platform ID</Label>
                <Input
                  value={editPlatformId}
                  onChange={(e) => setEditPlatformId(e.target.value)}
                  placeholder={
                    PLATFORM_HINTS[editPlatform] ?? 'Select a platform first'
                  }
                  disabled={!editPlatform}
                  className="bg-background border-border"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleSaveEdit}
                disabled={!editName}
              >
                <Check className="h-3 w-3" />
                Save
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancelEdit}
              >
                <X className="h-3 w-3" />
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-foreground truncate">
                {project.name}
              </h3>
              <span className="text-xs text-muted-foreground font-mono">
                {project.id}
              </span>
              {platformLabel && (
                <Badge
                  variant="outline"
                  className={cn(
                    'text-[10px] border',
                    PLATFORM_BADGE_STYLES[project.platform ?? ''] ??
                      'border-border text-muted-foreground'
                  )}
                >
                  {platformLabel}
                </Badge>
              )}
            </div>
            {project.url && (
              <p className="text-sm text-muted-foreground mt-0.5 truncate">
                {project.url}
              </p>
            )}
            {project.platformId && (
              <p className="text-xs text-muted-foreground/70 mt-0.5 font-mono truncate">
                {project.platformId}
              </p>
            )}
          </div>
        )}

        {!editing && (
          <div className="flex items-center gap-1">
            <Button
              size="icon-xs"
              variant="ghost"
              onClick={() => setEditing(true)}
              title="Edit project"
            >
              <Pencil className="h-3 w-3" />
            </Button>
            <Button
              size="icon-xs"
              variant="ghost"
              onClick={() => setDeleteOpen(true)}
              title="Delete project"
              className="text-red-400 hover:text-red-300"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>

      {/* Widget snippet */}
      <div className="relative">
        <pre className="text-xs bg-background border border-border rounded-md p-3 font-mono text-foreground overflow-x-auto">
          {snippet}
        </pre>
        <Button
          size="icon-xs"
          variant="ghost"
          onClick={handleCopySnippet}
          className="absolute top-2 right-2"
          title="Copy snippet"
        >
          {copied ? (
            <Check className="h-3 w-3 text-green-400" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
        </Button>
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete{' '}
            <span className="text-foreground font-medium">
              {project.name}
            </span>
            ? This will also remove its widget config, bugs, and env vars.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                await onDelete(project.id)
                setDeleteOpen(false)
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
