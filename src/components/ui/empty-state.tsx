import { type LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  readonly icon: LucideIcon
  readonly message: string
  readonly description?: string
  readonly children?: React.ReactNode
}

export function EmptyState({ icon: Icon, message, description, children }: EmptyStateProps) {
  return (
    <div className="text-center py-16 text-muted-foreground">
      <Icon className="h-10 w-10 mx-auto mb-3 opacity-50" />
      <p>{message}</p>
      {description && (
        <p className="text-xs mt-1">{description}</p>
      )}
      {children && (
        <div className="mt-4">{children}</div>
      )}
    </div>
  )
}
