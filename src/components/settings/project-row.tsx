'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Check, Copy, Pencil, Trash2, X } from 'lucide-react'

type Project = {
  id: string
  name: string
  url: string | null
  createdAt: string | null
}

type ProjectRowProps = {
  readonly project: Project
  readonly onUpdate: (id: string, name: string, url: string) => Promise<void>
  readonly onDelete: (id: string) => Promise<void>
}

export function ProjectRow({ project, onUpdate, onDelete }: ProjectRowProps) {
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(project.name)
  const [editUrl, setEditUrl] = useState(project.url ?? '')
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const snippet = [
    '<script src="https://devtools.jbcloud.app/widget.js"',
    `        data-project="${project.id}"`,
    '        data-pin="YOUR_PIN_HASH"></script>',
  ].join('\n')

  async function handleSaveEdit() {
    await onUpdate(project.id, editName, editUrl)
    setEditing(false)
  }

  function handleCancelEdit() {
    setEditName(project.name)
    setEditUrl(project.url ?? '')
    setEditing(false)
  }

  async function handleCopySnippet() {
    await navigator.clipboard.writeText(snippet)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="border border-slate-800 rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between gap-4">
        {editing ? (
          <div className="flex-1 space-y-2">
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Project name"
              className="bg-slate-950 border-slate-700"
            />
            <Input
              value={editUrl}
              onChange={(e) => setEditUrl(e.target.value)}
              placeholder="https://example.com (optional)"
              className="bg-slate-950 border-slate-700"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSaveEdit} disabled={!editName}>
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
              <h3 className="font-medium text-white truncate">
                {project.name}
              </h3>
              <span className="text-xs text-slate-500 font-mono">
                {project.id}
              </span>
            </div>
            {project.url && (
              <p className="text-sm text-slate-400 mt-0.5 truncate">
                {project.url}
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
        <pre className="text-xs bg-slate-950 border border-slate-800 rounded-md p-3 font-mono text-slate-300 overflow-x-auto">
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
        <DialogContent className="bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-400">
            Are you sure you want to delete{' '}
            <span className="text-white font-medium">{project.name}</span>?
            This will also remove its widget config, bugs, and env vars.
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
