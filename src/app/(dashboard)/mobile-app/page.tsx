'use client'

import { useState } from 'react'
import {
  Smartphone, BarChart3, Bell, Bug, FileText,
  ArrowRight, Wifi, Shield,
} from 'lucide-react'
import {
  Card, CardContent, CardHeader,
  CardTitle, CardDescription,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PhoneMockup } from '@/components/phone-mockup'

const FEATURES = [
  {
    icon: BarChart3,
    title: 'Live Dashboard',
    description:
      'Monitor errors, performance, and logs in real-time from your phone.',
  },
  {
    icon: Bell,
    title: 'Push Notifications',
    description:
      'Get alerted instantly when errors spike or performance degrades.',
  },
  {
    icon: Bug,
    title: 'Bug Triage',
    description: 'Review, assign, and resolve bugs on the go.',
  },
  {
    icon: FileText,
    title: 'Dev Log Reader',
    description:
      'Browse dev log entries and deployment history anywhere.',
  },
] as const

const TECH_STACK = [
  {
    icon: Smartphone,
    label: 'React Native / Expo for cross-platform',
  },
  {
    icon: Wifi,
    label: 'Shared API with web dashboard',
  },
  {
    icon: Shield,
    label: 'Offline support for key features',
  },
] as const

export default function MobileAppPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (email.trim()) {
      setSubmitted(true)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-10">
      {/* Header */}
      <div className="space-y-2 text-center">
        <div className="flex items-center justify-center gap-3">
          <Smartphone className="h-6 w-6 text-slate-400" />
          <h1 className="text-2xl font-bold">DevTools Mobile</h1>
          <Badge variant="secondary">Coming Soon</Badge>
        </div>
        <p className="text-sm text-slate-400 max-w-md mx-auto">
          A native companion app for iOS and Android, putting your
          developer toolkit in your pocket.
        </p>
      </div>

      {/* Phone Mockup */}
      <PhoneMockup />

      {/* Feature Cards */}
      <div>
        <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-4 text-center">
          Planned Features
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {FEATURES.map((feature) => (
            <Card
              key={feature.title}
              className="bg-slate-900 border-slate-800"
            >
              <CardContent className="flex items-start gap-3 pt-5">
                <div className="shrink-0 mt-0.5 flex h-8 w-8 items-center justify-center rounded-md bg-slate-800 border border-slate-700">
                  <feature.icon className="h-4 w-4 text-slate-300" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-200">
                    {feature.title}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {feature.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Email Signup */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-base">Get Notified</CardTitle>
          <CardDescription>
            Be the first to know when the mobile app launches.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {submitted ? (
            <div className="flex items-center gap-2 text-sm text-green-400">
              <ArrowRight className="h-4 w-4" />
              <span>Thanks! We will notify you at launch.</span>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="flex items-center gap-2"
            >
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="flex-1 border-slate-700 bg-slate-950"
              />
              <Button type="submit" size="sm">
                Notify Me
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Tech Stack */}
      <div className="space-y-3 pb-6">
        <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wider text-center">
          Planned Technology
        </h2>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          {TECH_STACK.map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-2 text-xs text-slate-400"
            >
              <item.icon className="h-3.5 w-3.5 text-slate-500" />
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
