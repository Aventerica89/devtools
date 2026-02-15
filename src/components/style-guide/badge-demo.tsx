import { CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { SectionWrapper } from './section-wrapper'

const VARIANTS = [
  'default',
  'secondary',
  'destructive',
  'outline',
] as const

const ICON_BADGES = [
  { label: 'Success', icon: CheckCircle, className: 'bg-green-600' },
  { label: 'Warning', icon: AlertTriangle, className: 'bg-amber-600' },
  { label: 'Error', icon: XCircle, className: 'bg-red-600' },
  { label: 'Info', icon: Info, className: 'bg-blue-600' },
] as const

export function BadgeDemo() {
  return (
    <SectionWrapper
      id="badges"
      title="Badges"
      description="Status indicators and labels in all variants"
    >
      <div className="space-y-8">
        {/* Variants */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-foreground">Variants</h3>
          <div className="flex flex-wrap items-center gap-3">
            {VARIANTS.map((variant) => (
              <Badge key={variant} variant={variant}>
                {variant}
              </Badge>
            ))}
          </div>
        </div>

        {/* With Icons */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-foreground">With Icons</h3>
          <div className="flex flex-wrap items-center gap-3">
            {ICON_BADGES.map((badge) => (
              <Badge key={badge.label} className={badge.className}>
                <badge.icon className="size-3" />
                {badge.label}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </SectionWrapper>
  )
}
