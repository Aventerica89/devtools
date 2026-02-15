# Changelog

All notable changes to DevTools are documented in this file.

## Unreleased - February 15, 2026

### New Features

- Console logs, network requests, and errors from your sites now stream to the dashboard in real-time via the embedded widget
- Added editable AI API key input with database persistence in settings
- Added dedicated Console Log, Network Log, and Error Log monitoring pages with filtering and search
- Added performance dashboard with Web Vitals trends (LCP, CLS, INP, FCP, TTFB)
- Added AI-powered code analysis and error explanation endpoints
- Added App Tracker integration with deployments dashboard
- Added developer tools: API Tester, JSON Viewer, Regex Tester, Color and CSS Tools, and Environment Variable Manager
- Added settings pages for projects, AI provider, and widget configuration
- Added style guide page showcasing all UI components
- Added mobile app companion mockup page
- Added floating dev button for quick access to developer tools
- Added dashboard overview with project stats and navigation
- Built embeddable widget with console, network, error, and performance interceptors
- Added widget floating button and expandable tool panel for on-site debugging
- Added bug reporter overlay in the widget for end-user feedback
- Widget batches events and flushes every 10 seconds or uses sendBeacon on page unload
- Set up Vite and Preact build pipeline for the widget (52KB, ~17KB gzipped)
- Added dev log API and timeline page for event history
- Added bug tracker API and dashboard page
- Added project management API with dashboard shell and sidebar navigation
- Added PIN-based authentication with session tokens
- Added database schema with 5 tables via Drizzle and Turso

### Bug Fixes

- Restored the slate-blue tinted dark theme across all CSS variables
- Replaced 650+ hardcoded color values with proper design tokens for consistent theming
- Fixed dark mode not activating due to missing class on the HTML element
- Resolved all ESLint errors for clean CI builds

### Documentation

- Added implementation plan covering 28 tasks across 7 phases
- Added DevTools design document
