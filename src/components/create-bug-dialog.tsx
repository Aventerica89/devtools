'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

const SEVERITIES = ['low', 'medium', 'high', 'critical'] as const

type Project = {
  id: string
  name: string
}

type DefaultValues = {
  projectId?: string
  title?: string
  description?: string
  severity?: string
  pageUrl?: string
  stackTrace?: string
  metadata?: Record<string, unknown>
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  projects: Project[]
  defaultValues?: DefaultValues
  onSubmit: (data: {
    projectId: string
    title: string
    description: string | null
    severity: string
    pageUrl: string | null
    stackTrace: string | null
    metadata: string | null
  }) => void
}

export function CreateBugDialog({
  open,
  onOpenChange,
  projects,
  defaultValues,
  onSubmit,
}: Props) {
  const [form, setForm] = useState({
    projectId: '',
    title: '',
    description: '',
    severity: 'medium',
    pageUrl: '',
    stackTrace: '',
  })

  // Reset form when dialog opens with new defaults
  useEffect(() => {
    if (open) {
      setForm({
        projectId: defaultValues?.projectId || '',
        title: defaultValues?.title || '',
        description: defaultValues?.description || '',
        severity: defaultValues?.severity || 'medium',
        pageUrl: defaultValues?.pageUrl || '',
        stackTrace: defaultValues?.stackTrace || '',
      })
    }
  }, [open, defaultValues])

  function handleSubmit() {
    if (!form.projectId || !form.title) return
    onSubmit({
      projectId: form.projectId,
      title: form.title,
      description: form.description || null,
      severity: form.severity,
      pageUrl: form.pageUrl || null,
      stackTrace: form.stackTrace || null,
      metadata: defaultValues?.metadata
        ? JSON.stringify(defaultValues.metadata)
        : null,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle>Report a Bug</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Project</Label>
            <select
              value={form.projectId}
              onChange={(e) =>
                setForm({ ...form, projectId: e.target.value })
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
            <Label>Title</Label>
            <Input
              value={form.title}
              onChange={(e) =>
                setForm({ ...form, title: e.target.value })
              }
              placeholder="Brief description of the bug"
              className="bg-background border-border"
            />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="Steps to reproduce, expected vs actual behavior"
              rows={3}
              className={cn(
                'w-full rounded-md border border-border',
                'bg-background text-foreground text-sm p-3',
                'focus:outline-none focus:ring-2 focus:ring-ring',
                'resize-none'
              )}
            />
          </div>

          <div className="space-y-2">
            <Label>Severity</Label>
            <div className="flex gap-2">
              {SEVERITIES.map((s) => (
                <Button
                  key={s}
                  variant={form.severity === s ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setForm({ ...form, severity: s })}
                  className="capitalize text-xs"
                >
                  {s}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Page URL (optional)</Label>
            <Input
              value={form.pageUrl}
              onChange={(e) =>
                setForm({ ...form, pageUrl: e.target.value })
              }
              placeholder="https://..."
              className="bg-background border-border"
            />
          </div>

          <div className="space-y-2">
            <Label>Stack Trace (optional)</Label>
            <textarea
              value={form.stackTrace}
              onChange={(e) =>
                setForm({ ...form, stackTrace: e.target.value })
              }
              placeholder="Paste stack trace here"
              rows={3}
              className={cn(
                'w-full rounded-md border border-border',
                'bg-background text-foreground text-sm p-3 font-mono',
                'focus:outline-none focus:ring-2 focus:ring-ring',
                'resize-none'
              )}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!form.projectId || !form.title}
          >
            Submit Bug
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
