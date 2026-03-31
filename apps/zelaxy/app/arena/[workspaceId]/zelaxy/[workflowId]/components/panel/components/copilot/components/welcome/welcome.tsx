'use client'

interface CopilotWelcomeProps {
  onQuestionClick?: (question: string) => void
  mode?: 'ask' | 'agent'
}

export function CopilotWelcome({ onQuestionClick, mode = 'ask' }: CopilotWelcomeProps) {
  const askQuestions = [
    'How do I create a workflow?',
    'What tools are available?',
    'What does my workflow do?',
  ]

  const agentQuestions = [
    'Help me build a workflow',
    'Create a workflow to send emails',
    'Build me an automation for data processing',
  ]

  const exampleQuestions = mode === 'ask' ? askQuestions : agentQuestions

  const handleQuestionClick = (question: string) => {
    onQuestionClick?.(question)
  }

  return (
    <div className='flex h-full flex-col items-center justify-center px-4 py-10'>
      <div className='space-y-6 text-center'>
        {/* Zelaxy Logo */}
        <div className='mb-2 flex justify-center'>
          <div className='group relative'>
            <div className='flex h-16 w-16 items-center justify-center'>
              <img
                src='/Zelaxy.png'
                alt='Zelaxy'
                width={32}
                height={32}
                className='h-8 w-8 transition-all duration-500 group-hover:scale-110'
              />
            </div>
            <div className='-inset-2 absolute rounded-full bg-gradient-to-r from-primary/20 via-orange-600/20 to-primary/20 opacity-0 blur-lg transition-all duration-500 group-hover:opacity-100 dark:from-primary/30 dark:via-orange-400/30 dark:to-orange-400/30' />
          </div>
        </div>
        <div className='space-y-2'>
          <h3 className='font-medium text-lg'>Hi! I'm Agie 👋</h3>
          <p className='text-muted-foreground text-sm'>
            {mode === 'ask'
              ? 'Your AI copilot in every flow. Ask me anything about your workflows, available tools, or how to get started.'
              : 'Where conversations power automation. I can help you talk, create, and automate. What would you like to build today?'}
          </p>
        </div>

        {/* Development Note */}
        <div className='mx-auto mb-4 max-w-sm'>
          <div className='rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 dark:border-primary/30 dark:bg-primary/15'>
            <p className='text-primary text-xs dark:text-primary/70'>
              <span className='font-medium'>Development Note:</span> Agie is still in active
              development, but you can interact normally with the AI assistant.
            </p>
          </div>
        </div>

        <div className='mx-auto max-w-sm space-y-3'>
          <div className='font-medium text-muted-foreground text-xs'>Try asking:</div>
          <div className='flex flex-wrap justify-center gap-2'>
            {exampleQuestions.map((question, index) => (
              <button
                key={index}
                className='inline-flex cursor-pointer items-center rounded-full bg-muted/60 px-3 py-1.5 font-medium text-muted-foreground text-xs transition-all hover:scale-105 hover:bg-muted hover:text-foreground active:scale-95'
                onClick={() => handleQuestionClick(question)}
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
