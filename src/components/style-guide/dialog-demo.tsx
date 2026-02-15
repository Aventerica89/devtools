'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SectionWrapper } from './section-wrapper'

export function DialogDemo() {
  return (
    <SectionWrapper
      id="dialogs"
      title="Dialogs"
      description="Modal dialogs for confirmations and forms"
    >
      <div className="flex flex-wrap gap-4">
        {/* Basic Dialog */}
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">Preview Dialog</Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-slate-50">
                Sample Dialog
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                This is a preview of the dialog component with a header,
                body content, and footer actions.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-4">
              <div className="space-y-1.5">
                <Label htmlFor="dialog-name" className="text-slate-300">
                  Name
                </Label>
                <Input
                  id="dialog-name"
                  placeholder="Enter name..."
                />
              </div>
            </div>
            <DialogFooter showCloseButton>
              <Button>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Destructive Dialog */}
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="destructive">Delete Dialog</Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-slate-50">
                Confirm Deletion
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                This action cannot be undone. Are you sure you want to
                proceed?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter showCloseButton>
              <Button variant="destructive">Delete</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </SectionWrapper>
  )
}
