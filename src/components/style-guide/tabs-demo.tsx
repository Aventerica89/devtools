import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { SectionWrapper } from './section-wrapper'

export function TabsDemo() {
  return (
    <SectionWrapper
      id="tabs"
      title="Tabs"
      description="Tab navigation for organizing related content"
    >
      <div className="space-y-8">
        {/* Default Style */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-slate-300">Default</h3>
          <Tabs defaultValue="overview">
            <TabsList className="bg-slate-800/50 border border-slate-700">
              <TabsTrigger value="overview" className="text-xs">
                Overview
              </TabsTrigger>
              <TabsTrigger value="analytics" className="text-xs">
                Analytics
              </TabsTrigger>
              <TabsTrigger value="settings" className="text-xs">
                Settings
              </TabsTrigger>
            </TabsList>
            <TabsContent value="overview">
              <div className="rounded-md border border-slate-700 p-4">
                <p className="text-sm text-slate-300">
                  Overview tab content. This is the default selected tab.
                </p>
              </div>
            </TabsContent>
            <TabsContent value="analytics">
              <div className="rounded-md border border-slate-700 p-4">
                <p className="text-sm text-slate-300">
                  Analytics tab content with charts and data.
                </p>
              </div>
            </TabsContent>
            <TabsContent value="settings">
              <div className="rounded-md border border-slate-700 p-4">
                <p className="text-sm text-slate-300">
                  Settings tab content with configuration options.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Line Style */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-slate-300">Line Variant</h3>
          <Tabs defaultValue="tab1">
            <TabsList variant="line">
              <TabsTrigger value="tab1" className="text-xs">
                Tab One
              </TabsTrigger>
              <TabsTrigger value="tab2" className="text-xs">
                Tab Two
              </TabsTrigger>
              <TabsTrigger value="tab3" className="text-xs">
                Tab Three
              </TabsTrigger>
            </TabsList>
            <TabsContent value="tab1">
              <div className="rounded-md border border-slate-700 p-4 mt-2">
                <p className="text-sm text-slate-300">
                  Line-style tabs use an underline indicator instead of a
                  background highlight.
                </p>
              </div>
            </TabsContent>
            <TabsContent value="tab2">
              <div className="rounded-md border border-slate-700 p-4 mt-2">
                <p className="text-sm text-slate-300">
                  Second tab content.
                </p>
              </div>
            </TabsContent>
            <TabsContent value="tab3">
              <div className="rounded-md border border-slate-700 p-4 mt-2">
                <p className="text-sm text-slate-300">
                  Third tab content.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </SectionWrapper>
  )
}
