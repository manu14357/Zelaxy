import * as React from 'react'
import { cn } from '@/lib/utils'

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<'textarea'>>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[80px] w-full border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
          className
        )}
        ref={ref}
        // Turn off the native red spellcheck squiggle (keeps the text clean/legible) and ask browser
        // writing-assistant extensions (Grammarly / Quillbot / LanguageTool) not to inject their
        // overlay widget inside the field — that's the "field inside a field" artifact. All
        // overridable: a field that wants spellcheck can pass spellCheck for itself.
        spellCheck={false}
        data-gramm='false'
        data-gramm_editor='false'
        data-enable-grammarly='false'
        data-enable-quillbot='false'
        {...props}
      />
    )
  }
)
Textarea.displayName = 'Textarea'

export { Textarea }
