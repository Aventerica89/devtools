import { SectionWrapper } from './section-wrapper'

export function TypographyDemo() {
  return (
    <SectionWrapper
      id="typography"
      title="Typography"
      description="Heading hierarchy, body text, and inline styles"
    >
      <div className="space-y-6">
        {/* Headings */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-slate-300">Headings</h3>
          <div className="space-y-3 rounded-md border border-slate-700 p-4">
            <h1 className="text-4xl font-bold tracking-tight text-slate-50">
              Heading 1 -- 4xl Bold
            </h1>
            <h2 className="text-2xl font-semibold text-slate-50">
              Heading 2 -- 2xl Semibold
            </h2>
            <h3 className="text-xl font-semibold text-slate-50">
              Heading 3 -- xl Semibold
            </h3>
            <h4 className="text-lg font-medium text-slate-50">
              Heading 4 -- lg Medium
            </h4>
          </div>
        </div>

        {/* Body text */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-slate-300">Body Text</h3>
          <div className="space-y-3 rounded-md border border-slate-700 p-4">
            <p className="text-base text-slate-200">
              Base paragraph text (16px). Used for primary content and
              descriptions throughout the dashboard.
            </p>
            <p className="text-sm text-slate-400">
              Small text (14px, slate-400). Used for secondary information,
              timestamps, and metadata.
            </p>
            <p className="text-xs text-slate-500">
              Extra small text (12px, slate-500). Used for labels, captions,
              and tertiary information.
            </p>
          </div>
        </div>

        {/* Inline styles */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-slate-300">Inline Styles</h3>
          <div className="space-y-3 rounded-md border border-slate-700 p-4">
            <p className="text-sm text-slate-200">
              <code className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-xs text-blue-400">
                Inline code
              </code>
              {' '}uses mono font with a subtle background.
            </p>
            <p className="text-sm">
              <a
                href="#typography"
                className="text-blue-400 underline underline-offset-4 hover:text-blue-300"
              >
                Link text
              </a>
              {' '}uses blue-400 with underline and hover state.
            </p>
            <p className="text-sm text-slate-200">
              <strong className="font-semibold text-slate-50">
                Bold text
              </strong>
              {' '}and{' '}
              <em className="italic text-slate-300">italic text</em>
              {' '}for emphasis.
            </p>
          </div>
        </div>
      </div>
    </SectionWrapper>
  )
}
