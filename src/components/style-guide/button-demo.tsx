import { PlusIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SectionWrapper } from './section-wrapper'

const VARIANTS = [
  'default',
  'destructive',
  'outline',
  'secondary',
  'ghost',
  'link',
] as const

const SIZES = ['default', 'sm', 'lg', 'icon'] as const

export function ButtonDemo() {
  return (
    <SectionWrapper
      id="buttons"
      title="Buttons"
      description="All button variants and sizes"
    >
      <div className="space-y-8">
        {/* Variants */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-slate-300">Variants</h3>
          <div className="flex flex-wrap items-center gap-3">
            {VARIANTS.map((variant) => (
              <Button key={variant} variant={variant}>
                {variant}
              </Button>
            ))}
          </div>
        </div>

        {/* Sizes */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-slate-300">Sizes</h3>
          <div className="flex flex-wrap items-center gap-3">
            {SIZES.map((size) => (
              <Button key={size} size={size} variant="outline">
                {size === 'icon' ? <PlusIcon /> : size}
              </Button>
            ))}
          </div>
        </div>

        {/* States */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-slate-300">States</h3>
          <div className="flex flex-wrap items-center gap-3">
            <Button>Enabled</Button>
            <Button disabled>Disabled</Button>
            <Button size="sm">
              <PlusIcon />
              With Icon
            </Button>
          </div>
        </div>
      </div>
    </SectionWrapper>
  )
}
