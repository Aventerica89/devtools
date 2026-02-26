import { readFileSync } from 'fs'
import { join } from 'path'
import { currentUser } from '@clerk/nextjs/server'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ChangelogRenderer } from '@/components/changelog-renderer'

function readFileSafe(filePath: string): string {
  try {
    return readFileSync(filePath, 'utf-8')
  } catch {
    return ''
  }
}

export default async function ChangelogPage() {
  const user = await currentUser()
  const role = (user?.publicMetadata?.role as string) ?? 'viewer'
  const isOwner = role === 'owner'

  const root = join(process.cwd())
  const publicLog = readFileSafe(join(root, 'CHANGELOG.md'))
  const devLog = readFileSafe(join(root, 'CHANGELOG-DEV.md'))

  const hasPublicEntries = publicLog.split('\n').some(l => l.startsWith('## v'))
  const hasDevEntries = devLog.split('\n').some(l => l.startsWith('### '))

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Changelog</h1>
        <p className="text-muted-foreground text-sm mt-1">Release history and technical log</p>
      </div>

      <Tabs defaultValue="whats-new">
        <TabsList>
          <TabsTrigger value="whats-new">What&apos;s New</TabsTrigger>
          {isOwner && <TabsTrigger value="dev-log">Dev Log</TabsTrigger>}
        </TabsList>

        <TabsContent value="whats-new" className="mt-4">
          {hasPublicEntries ? (
            <ChangelogRenderer content={publicLog} className="bg-muted/50 rounded-lg p-4" />
          ) : (
            <div className="text-muted-foreground text-sm border border-dashed rounded-lg p-8 text-center">
              No releases published yet. Run <code className="bg-muted px-1 rounded">/changelog feature &quot;description&quot;</code> after your next deploy.
            </div>
          )}
        </TabsContent>

        {isOwner && (
          <TabsContent value="dev-log" className="mt-4">
            {hasDevEntries ? (
              <ChangelogRenderer content={devLog} className="bg-muted/50 rounded-lg p-4" />
            ) : (
              <div className="text-muted-foreground text-sm border border-dashed rounded-lg p-8 text-center">
                No dev log entries yet. Entries are added automatically on each deploy.
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
