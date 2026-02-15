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
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="pt-6">
            <p className="text-sm text-slate-300">
              A basic card with only content. No header, no footer.
            </p>
          </CardContent>
        </Card>

        {/* Card with Header */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-slate-50">Card Title</CardTitle>
            <CardDescription className="text-slate-400">
              Card with a header, title, and description.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-300">
              This card includes a header section with a title and
              description for additional context.
            </p>
          </CardContent>
        </Card>

        {/* Interactive Card */}
        <Card className="group bg-slate-800/50 border-slate-700 transition-all hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/5">
          <CardHeader>
            <CardTitle className="text-slate-50 group-hover:text-blue-400 transition-colors">
              Interactive Card
            </CardTitle>
            <CardDescription className="text-slate-400">
              Hover to see the interaction effect.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-300">
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
