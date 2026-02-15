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
      <Card className="bg-card border-border">
        <CardHeader className="border-b border-border">
          <CardTitle className="text-foreground text-lg">{title}</CardTitle>
          <CardDescription className="text-muted-foreground">
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">{children}</CardContent>
      </Card>
    </section>
  )
}
