import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { SectionWrapper } from './section-wrapper'

interface TableEntry {
  readonly id: string
  readonly name: string
  readonly status: 'active' | 'inactive' | 'pending'
  readonly role: string
  readonly lastSeen: string
}

const TABLE_DATA: readonly TableEntry[] = [
  {
    id: 'USR-001',
    name: 'Alice Johnson',
    status: 'active',
    role: 'Admin',
    lastSeen: '2 min ago',
  },
  {
    id: 'USR-002',
    name: 'Bob Smith',
    status: 'inactive',
    role: 'Developer',
    lastSeen: '3 days ago',
  },
  {
    id: 'USR-003',
    name: 'Carol White',
    status: 'pending',
    role: 'Viewer',
    lastSeen: '1 hour ago',
  },
  {
    id: 'USR-004',
    name: 'Dave Brown',
    status: 'active',
    role: 'Developer',
    lastSeen: '5 min ago',
  },
]

const STATUS_STYLES: Record<
  TableEntry['status'],
  { variant: 'default' | 'secondary' | 'outline'; label: string }
> = {
  active: { variant: 'default', label: 'Active' },
  inactive: { variant: 'secondary', label: 'Inactive' },
  pending: { variant: 'outline', label: 'Pending' },
}

export function TableDemo() {
  return (
    <SectionWrapper
      id="tables"
      title="Tables"
      description="Data table with headers, rows, and status badges"
    >
      <div className="rounded-md border border-slate-700">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-700 hover:bg-slate-800/50">
              <TableHead className="text-slate-300">ID</TableHead>
              <TableHead className="text-slate-300">Name</TableHead>
              <TableHead className="text-slate-300">Status</TableHead>
              <TableHead className="text-slate-300">Role</TableHead>
              <TableHead className="text-slate-300 text-right">
                Last Seen
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {TABLE_DATA.map((row) => {
              const status = STATUS_STYLES[row.status]
              return (
                <TableRow
                  key={row.id}
                  className="border-slate-700 hover:bg-slate-800/50"
                >
                  <TableCell className="font-mono text-xs text-slate-400">
                    {row.id}
                  </TableCell>
                  <TableCell className="text-slate-200">
                    {row.name}
                  </TableCell>
                  <TableCell>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </TableCell>
                  <TableCell className="text-slate-300">
                    {row.role}
                  </TableCell>
                  <TableCell className="text-right text-slate-400">
                    {row.lastSeen}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </SectionWrapper>
  )
}
