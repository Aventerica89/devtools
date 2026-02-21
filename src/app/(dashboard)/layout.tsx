import { Sidebar } from '@/components/sidebar'
import { DevButton } from '@/components/dev-button'
import { CommandPalette } from '@/components/command-palette'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen bg-background text-foreground">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6">
        {children}
      </main>
      <DevButton />
      <CommandPalette />
    </div>
  )
}
