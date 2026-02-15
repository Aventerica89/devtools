import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

interface SectionWrapperProps {
  readonly id: string
  readonly title: string
  readonly description: string
  readonly children: React.ReactNode
}

export function SectionWrapper({
  id,
  title,
  description,
  children,
}: SectionWrapperProps) {
  return (
    <section id={id} className="scroll-mt-6">
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="border-b border-slate-800">
          <CardTitle className="text-slate-50 text-lg">{title}</CardTitle>
          <CardDescription className="text-slate-400">
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">{children}</CardContent>
      </Card>
    </section>
  )
}
