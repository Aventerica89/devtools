import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SectionWrapper } from './section-wrapper'

export function CardDemo() {
  return (
    <SectionWrapper
      id="cards"
      title="Cards"
      description="Basic, descriptive, and interactive card layouts"
    >
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Basic Card */}
        <Card className="bg-muted/50 border-border">
          <CardContent className="pt-6">
            <p className="text-sm text-foreground">
              A basic card with only content. No header, no footer.
            </p>
          </CardContent>
        </Card>

        {/* Card with Header */}
        <Card className="bg-muted/50 border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Card Title</CardTitle>
            <CardDescription className="text-muted-foreground">
              Card with a header, title, and description.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground">
              This card includes a header section with a title and
              description for additional context.
            </p>
          </CardContent>
        </Card>

        {/* Interactive Card */}
        <Card className="group bg-muted/50 border-border transition-all hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/5">
          <CardHeader>
            <CardTitle className="text-foreground group-hover:text-blue-400 transition-colors">
              Interactive Card
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Hover to see the interaction effect.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground">
              This card has hover effects: border color change, shadow,
              and title color transition.
            </p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" size="sm">
              Action
            </Button>
          </CardFooter>
        </Card>
      </div>
    </SectionWrapper>
  )
}
