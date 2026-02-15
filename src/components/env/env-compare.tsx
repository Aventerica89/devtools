'use client'

import { useState, useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import type { EnvVar, Project } from './types'

type Props = {
  envVars: EnvVar[]
  projects: Project[]
}

type CompareStatus = 'match' | 'differ' | 'missing-left' | 'missing-right'

type CompareRow = {
  key: string
  leftValue: string | null
  rightValue: string | null
  status: CompareStatus
}

function statusBadge(status: CompareStatus) {
  const styles: Record<CompareStatus, string> = {
    match: 'bg-green-900/50 text-green-400 border-green-800',
    differ: 'bg-yellow-900/50 text-yellow-400 border-yellow-800',
    'missing-left': 'bg-red-900/50 text-red-400 border-red-800',
    'missing-right': 'bg-red-900/50 text-red-400 border-red-800',
  }
  const labels: Record<CompareStatus, string> = {
    match: 'Match',
    differ: 'Differs',
    'missing-left': 'Missing',
    'missing-right': 'Missing',
  }
  return (
    <Badge
      variant="outline"
      className={cn('text-[10px] px-1.5 py-0', styles[status])}
    >
      {labels[status]}
    </Badge>
  )
}

export function EnvCompare({ envVars, projects }: Props) {
  const [leftProjectId, setLeftProjectId] = useState('')
  const [rightProjectId, setRightProjectId] = useState('')

  const compareRows = useMemo<CompareRow[]>(() => {
    if (!leftProjectId || !rightProjectId) return []

    const leftVars = envVars.filter((v) => v.projectId === leftProjectId)
    const rightVars = envVars.filter((v) => v.projectId === rightProjectId)

    const leftMap = new Map(leftVars.map((v) => [v.key, v.value]))
    const rightMap = new Map(rightVars.map((v) => [v.key, v.value]))

    const allKeys = [
      ...new Set([...leftMap.keys(), ...rightMap.keys()]),
    ].sort()

    return allKeys.map((key) => {
      const leftValue = leftMap.get(key) ?? null
      const rightValue = rightMap.get(key) ?? null

      let status: CompareStatus
      if (leftValue === null) {
        status = 'missing-left'
      } else if (rightValue === null) {
        status = 'missing-right'
      } else if (leftValue === rightValue) {
        status = 'match'
      } else {
        status = 'differ'
      }

      return { key, leftValue, rightValue, status }
    })
  }, [envVars, leftProjectId, rightProjectId])

  const stats = useMemo(() => {
    const counts = { match: 0, differ: 0, missing: 0 }
    for (const row of compareRows) {
      if (row.status === 'match') counts.match++
      else if (row.status === 'differ') counts.differ++
      else counts.missing++
    }
    return counts
  }, [compareRows])

  const selectClasses = cn(
    'h-8 rounded-md border border-slate-700',
    'bg-slate-900 text-white text-sm px-3',
    'focus:outline-none focus:ring-2 focus:ring-ring'
  )

  return (
    <div className="space-y-4">
      {/* Project selectors */}
      <div className="flex items-center gap-4">
        <div className="flex-1 space-y-1">
          <label className="text-xs text-slate-500">Project A</label>
          <select
            value={leftProjectId}
            onChange={(e) => setLeftProjectId(e.target.value)}
            className={cn(selectClasses, 'w-full')}
          >
            <option value="">Select project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <span className="text-slate-600 mt-5">vs</span>
        <div className="flex-1 space-y-1">
          <label className="text-xs text-slate-500">Project B</label>
          <select
            value={rightProjectId}
            onChange={(e) => setRightProjectId(e.target.value)}
            className={cn(selectClasses, 'w-full')}
          >
            <option value="">Select project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results */}
      {leftProjectId && rightProjectId ? (
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-0">
            <CardTitle className="text-sm text-slate-300 flex items-center gap-3">
              Comparison Results
              <div className="flex gap-2 text-xs font-normal">
                <span className="text-green-400">
                  {stats.match} match
                </span>
                <span className="text-yellow-400">
                  {stats.differ} differ
                </span>
                <span className="text-red-400">
                  {stats.missing} missing
                </span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {compareRows.length === 0 ? (
              <p className="text-sm text-slate-500 py-4 text-center">
                No variables found in either project
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-800">
                    <TableHead className="text-slate-500">Key</TableHead>
                    <TableHead className="text-slate-500">
                      {projects.find((p) => p.id === leftProjectId)
                        ?.name || 'Project A'}
                    </TableHead>
                    <TableHead className="text-slate-500">
                      {projects.find((p) => p.id === rightProjectId)
                        ?.name || 'Project B'}
                    </TableHead>
                    <TableHead className="text-slate-500 w-[80px]">
                      Status
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {compareRows.map((row) => (
                    <TableRow
                      key={row.key}
                      className="border-slate-800"
                    >
                      <TableCell className="font-mono text-sm">
                        {row.key}
                      </TableCell>
                      <TableCell className="font-mono text-sm text-slate-400">
                        {row.leftValue ?? (
                          <span className="text-red-400/50 italic">
                            not set
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-sm text-slate-400">
                        {row.rightValue ?? (
                          <span className="text-red-400/50 italic">
                            not set
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{statusBadge(row.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="text-center py-16 text-slate-500">
          <p>Select two projects to compare their env vars</p>
        </div>
      )}
    </div>
  )
}
