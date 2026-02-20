# Accessibility Improvements Guide

## Overview

This document outlines accessibility (a11y) improvements for the DevTools dashboard to ensure WCAG 2.1 AA compliance and better screen reader support.

## Current Issues

1. Missing ARIA landmarks
2. No skip-to-content link
3. Missing aria-labels on icon-only buttons
4. No focus management for modals/dialogs
5. Insufficient color contrast in some areas
6. Missing keyboard navigation hints

## Recommended Improvements

### 1. Sidebar Navigation (Priority: High)

**File**: `src/components/sidebar.tsx`

Add ARIA landmarks and labels:

```tsx
export function Sidebar() {
  return (
    <aside
      className="..."
      aria-label="Main navigation"
      role="navigation"
    >
      <ScrollArea className="...">
        {/* Logo/Header */}
        <div className="..." role="banner">
          <h1 className="sr-only">DevTools Dashboard</h1>
          {/* visual logo */}
        </div>

        {/* Navigation sections */}
        {sections.map((section) => (
          <nav key={section.label} aria-labelledby={`${section.label}-heading`}>
            <h2
              id={`${section.label}-heading`}
              className="text-xs font-semibold text-muted-foreground"
            >
              {section.label}
            </h2>
            <ul role="list">
              {section.items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-label={item.label}
                    aria-current={pathname === item.href ? 'page' : undefined}
                  >
                    <item.icon aria-hidden="true" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </ScrollArea>
    </aside>
  )
}
```

### 2. Skip to Content Link

**File**: `src/app/layout.tsx` or `src/components/skip-to-content.tsx`

```tsx
export function SkipToContent() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md"
    >
      Skip to main content
    </a>
  )
}
```

Add to layout:
```tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SkipToContent />
        <Sidebar />
        <main id="main-content" role="main">
          {children}
        </main>
      </body>
    </html>
  )
}
```

### 3. Icon-Only Buttons

**Files**: All components with icon-only buttons

Add aria-labels to all icon buttons:

```tsx
// Before
<Button size="icon" onClick={handleDelete}>
  <Trash2 className="h-4 w-4" />
</Button>

// After
<Button
  size="icon"
  onClick={handleDelete}
  aria-label="Delete bug"
>
  <Trash2 className="h-4 w-4" aria-hidden="true" />
</Button>
```

### 4. Form Labels

**Files**: All form components

Ensure all inputs have associated labels:

```tsx
// Using explicit label
<div>
  <Label htmlFor="project-name">Project Name</Label>
  <Input
    id="project-name"
    name="name"
    aria-required="true"
    aria-describedby="project-name-hint"
  />
  <p id="project-name-hint" className="text-xs text-muted-foreground">
    Enter a unique project identifier
  </p>
</div>

// Form errors
<Input
  id="email"
  aria-invalid={errors.email ? "true" : "false"}
  aria-describedby="email-error"
/>
{errors.email && (
  <p id="email-error" role="alert" className="text-red-500">
    {errors.email.message}
  </p>
)}
```

### 5. Dialogs and Modals

**Files**: Dialog components

Ensure proper focus management:

```tsx
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'

<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    {/* Title is required for a11y */}
    <DialogTitle>Confirm Delete</DialogTitle>

    {/* Description is recommended */}
    <DialogDescription>
      This action cannot be undone. This will permanently delete the bug.
    </DialogDescription>

    <div role="group" aria-label="Confirmation actions">
      <Button onClick={handleCancel}>Cancel</Button>
      <Button onClick={handleDelete} variant="destructive">
        Delete
      </Button>
    </div>
  </DialogContent>
</Dialog>
```

### 6. Loading States

**Files**: All components with async data

```tsx
// Loading skeleton
<div aria-live="polite" aria-busy={loading}>
  {loading ? (
    <div role="status">
      <span className="sr-only">Loading bugs...</span>
      <Skeleton />
    </div>
  ) : (
    <BugList bugs={bugs} />
  )}
</div>
```

### 7. Status Messages

**Files**: Forms, API interactions

```tsx
// Success message
<div role="status" aria-live="polite" className="...">
  Bug created successfully
</div>

// Error message
<div role="alert" aria-live="assertive" className="...">
  Failed to create bug: {error.message}
</div>
```

### 8. Tables

**Files**: `src/components/deployment-table.tsx`, etc.

```tsx
<table role="table">
  <caption className="sr-only">
    Deployment history for {project}
  </caption>
  <thead>
    <tr>
      <th scope="col">Date</th>
      <th scope="col">Status</th>
      <th scope="col">Branch</th>
      <th scope="col" className="sr-only">Actions</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>{date}</td>
      <td>
        <Badge aria-label={`Status: ${status}`}>
          {status}
        </Badge>
      </td>
      <td>{branch}</td>
      <td>
        <Button aria-label="View deployment details">
          View
        </Button>
      </td>
    </tr>
  </tbody>
</table>
```

### 9. Focus Indicators

**File**: `tailwind.config.ts` or global CSS

Ensure visible focus indicators:

```css
/* Add to global CSS */
*:focus-visible {
  outline: 2px solid hsl(var(--primary));
  outline-offset: 2px;
}

/* Skip to content */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

.sr-only:focus,
.sr-only:active {
  position: static;
  width: auto;
  height: auto;
  overflow: visible;
  clip: auto;
  white-space: normal;
}
```

### 10. Color Contrast

Run contrast checker on:
- Badge variants (severity, status)
- Muted text
- Disabled states

Minimum ratios:
- Normal text: 4.5:1
- Large text (18px+): 3:1
- UI components: 3:1

Use tools:
- Chrome DevTools Lighthouse
- axe DevTools extension
- WebAIM Contrast Checker

## Keyboard Navigation

### Ensure all interactive elements are keyboard accessible:

1. **Tab order**: Logical flow through interface
2. **Enter/Space**: Activate buttons and links
3. **Arrow keys**: Navigate lists and menus
4. **Escape**: Close modals and dialogs
5. **Home/End**: Jump to start/end of lists

Example for custom select:
```tsx
<div
  role="listbox"
  onKeyDown={(e) => {
    if (e.key === 'ArrowDown') handleNext()
    if (e.key === 'ArrowUp') handlePrev()
    if (e.key === 'Enter') handleSelect()
    if (e.key === 'Escape') handleClose()
  }}
>
  {/* options */}
</div>
```

## Testing Checklist

### Manual Testing

- [ ] Tab through entire interface
- [ ] Test with screen reader (NVDA/JAWS on Windows, VoiceOver on Mac)
- [ ] Navigate without mouse
- [ ] Test with 200% zoom
- [ ] Test with Windows High Contrast mode
- [ ] Verify focus indicators visible
- [ ] Check color contrast

### Automated Testing

```bash
# Install axe-core for testing
npm install --save-dev @axe-core/react

# Add to tests
import { axe, toHaveNoViolations } from 'jest-axe'
expect.extend(toHaveNoViolations)

it('should have no accessibility violations', async () => {
  const { container } = render(<BugCard bug={mockBug} />)
  const results = await axe(container)
  expect(results).toHaveNoViolations()
})
```

## Screen Reader Announcements

### Live Regions

```tsx
// Toast notifications
<div
  role="status"
  aria-live="polite"
  aria-atomic="true"
  className="toast"
>
  Bug deleted successfully
</div>

// Error alerts
<div
  role="alert"
  aria-live="assertive"
  aria-atomic="true"
  className="error-toast"
>
  Failed to save changes
</div>
```

## Implementation Priority

1. **High Priority** (WCAG Level A violations)
   - Add alt text to all images
   - Ensure keyboard accessibility
   - Provide text alternatives for non-text content
   - Fix form labels

2. **Medium Priority** (WCAG Level AA)
   - Color contrast fixes
   - ARIA landmarks
   - Skip to content
   - Focus indicators

3. **Low Priority** (Nice to have)
   - Enhanced keyboard shortcuts
   - Reduced motion preferences
   - High contrast mode optimizations

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [A11y Project Checklist](https://www.a11yproject.com/checklist/)
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [WebAIM](https://webaim.org/)

## Quick Wins

Start with these 5 easy improvements:

1. Add `lang="en"` to `<html>` tag
2. Add skip to content link
3. Add aria-labels to icon-only buttons
4. Ensure all form inputs have labels
5. Add focus-visible outline styles
