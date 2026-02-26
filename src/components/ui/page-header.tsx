import { Badge } from '@/components/ui/badge'
import { type LucideIcon } from 'lucide-react'

interface PageHeaderProps {
  readonly icon: LucideIcon
  readonly title: string
  readonly count?: number
  readonly children?: React.ReactNode
}

export function PageHeader({ icon: Icon, title, count, children }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-muted-foreground" />
        <h1 className="text-xl font-bold">{title}</h1>
        {count !== undefined && (
          <Badge variant="secondary" className="text-xs">
            {count}
          </Badge>
        )}
      </div>
      {children && (
        <div className="flex items-center gap-2">
          {children}
        </div>
      )}
    </div>
  )
}
