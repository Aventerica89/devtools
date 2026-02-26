import { Sidebar } from '@/components/sidebar'
import { DevButton } from '@/components/dev-button'
import { CommandPalette } from '@/components/command-palette'
import { Toaster } from '@/components/ui/sonner'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen bg-background text-foreground">
      <Sidebar />
      <main className="flex-1 overflow-auto p-4 pt-14 md:pt-4">
        {children}
      </main>
      <DevButton />
      <CommandPalette />
      <Toaster theme="dark" position="bottom-right" richColors />
    </div>
  )
}
