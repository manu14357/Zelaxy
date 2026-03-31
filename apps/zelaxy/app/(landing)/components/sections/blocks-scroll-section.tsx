'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Bot,
  Brain,
  Calendar,
  Cloud,
  Code,
  Database,
  FileText,
  GitBranch,
  Globe,
  Image,
  Mail,
  MessageSquare,
  Search,
  Share2,
  Shield,
  Sparkles,
  Workflow,
  Zap,
} from 'lucide-react'

const blockRows = [
  [
    { name: 'OpenAI', icon: Bot, gradient: 'from-emerald-500 to-teal-600' },
    { name: 'Claude', icon: Brain, gradient: 'from-orange-500 to-amber-600' },
    { name: 'Gemini', icon: Sparkles, gradient: 'from-blue-500 to-indigo-600' },
    { name: 'Perplexity', icon: Search, gradient: 'from-purple-500 to-violet-600' },
    { name: 'HuggingFace', icon: Bot, gradient: 'from-yellow-500 to-orange-500' },
    { name: 'Vision', icon: Image, gradient: 'from-pink-500 to-rose-600' },
    { name: 'ElevenLabs', icon: Zap, gradient: 'from-slate-400 to-slate-600' },
    { name: 'Evaluator', icon: Shield, gradient: 'from-orange-400 to-primary' },
    { name: 'Thinking', icon: Brain, gradient: 'from-violet-500 to-purple-600' },
    { name: 'Mistral Parse', icon: FileText, gradient: 'from-primary to-orange-500' },
  ],
  [
    { name: 'Slack', icon: MessageSquare, gradient: 'from-purple-600 to-pink-600' },
    { name: 'Discord', icon: MessageSquare, gradient: 'from-indigo-500 to-blue-600' },
    { name: 'Teams', icon: MessageSquare, gradient: 'from-blue-500 to-blue-700' },
    { name: 'Gmail', icon: Mail, gradient: 'from-red-500 to-orange-500' },
    { name: 'Outlook', icon: Mail, gradient: 'from-blue-500 to-cyan-600' },
    { name: 'Telegram', icon: MessageSquare, gradient: 'from-sky-400 to-blue-500' },
    { name: 'WhatsApp', icon: MessageSquare, gradient: 'from-green-500 to-emerald-600' },
    { name: 'Twilio', icon: MessageSquare, gradient: 'from-red-600 to-pink-600' },
    { name: 'Notion', icon: FileText, gradient: 'from-neutral-400 to-neutral-600' },
    { name: 'Jira', icon: FileText, gradient: 'from-blue-500 to-blue-700' },
  ],
  [
    { name: 'Google Sheets', icon: Database, gradient: 'from-green-600 to-emerald-600' },
    { name: 'Airtable', icon: Database, gradient: 'from-yellow-500 to-orange-500' },
    { name: 'Supabase', icon: Database, gradient: 'from-green-500 to-emerald-600' },
    { name: 'Pinecone', icon: Database, gradient: 'from-teal-500 to-cyan-600' },
    { name: 'Snowflake', icon: Database, gradient: 'from-sky-400 to-blue-500' },
    { name: 'GitHub', icon: Code, gradient: 'from-neutral-400 to-neutral-600' },
    { name: 'Tavily', icon: Search, gradient: 'from-emerald-500 to-teal-500' },
    { name: 'Firecrawl', icon: Globe, gradient: 'from-orange-500 to-red-600' },
    { name: 'API', icon: Globe, gradient: 'from-purple-500 to-violet-600' },
    { name: 'Webhook', icon: Zap, gradient: 'from-primary to-amber-500' },
  ],
  [
    { name: 'Condition', icon: GitBranch, gradient: 'from-amber-500 to-orange-600' },
    { name: 'Function', icon: Code, gradient: 'from-violet-500 to-purple-600' },
    { name: 'Router', icon: Share2, gradient: 'from-cyan-500 to-blue-600' },
    { name: 'Loop', icon: Workflow, gradient: 'from-green-500 to-teal-600' },
    { name: 'Parallel', icon: Zap, gradient: 'from-rose-500 to-pink-600' },
    { name: 'Schedule', icon: Calendar, gradient: 'from-primary to-orange-600' },
    { name: 'Knowledge', icon: Brain, gradient: 'from-purple-600 to-violet-600' },
    { name: 'Memory', icon: Brain, gradient: 'from-pink-500 to-rose-600' },
    { name: 'S3', icon: Cloud, gradient: 'from-orange-500 to-red-500' },
    { name: 'Google Drive', icon: Cloud, gradient: 'from-yellow-500 to-orange-500' },
  ],
]

function BlockCard({
  name,
  icon: Icon,
  gradient,
}: {
  name: string
  icon: React.ElementType
  gradient: string
}) {
  return (
    <div className='group hover:-translate-y-0.5 flex flex-shrink-0 items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 backdrop-blur-sm transition-all duration-500 hover:border-white/10 hover:bg-white/[0.06]'>
      <div
        className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${gradient} transition-transform duration-500 group-hover:scale-110`}
      >
        <Icon className='h-4 w-4 text-white' />
      </div>
      <span className='whitespace-nowrap font-medium text-[13px] text-neutral-300'>{name}</span>
    </div>
  )
}

export function BlocksScrollSection() {
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setIsVisible(true)
        })
      },
      { threshold: 0.05 }
    )
    if (sectionRef.current) observer.observe(sectionRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <section
      ref={sectionRef}
      id='blocks'
      className='relative overflow-hidden bg-[#060606] py-28 sm:py-36'
    >
      {/* Header */}
      <div className='mx-auto mb-20 max-w-3xl px-6 text-center'>
        <p
          className={`mb-5 font-semibold text-[13px] text-primary uppercase tracking-[0.2em] transition-all duration-1000 ease-out ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}
        >
          Blocks & Tools
        </p>
        <h2
          className={`mb-5 font-bold text-[clamp(1.75rem,4vw,3rem)] text-white leading-[1.15] tracking-[-0.03em] transition-all delay-100 duration-1000 ease-out ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}
        >
          One block for everything.
        </h2>
        <p
          className={`mx-auto max-w-lg text-[17px] text-neutral-500 leading-relaxed transition-all delay-200 duration-1000 ease-out ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}
        >
          AI models, databases, APIs, communication tools, and logic — all as drag-and-drop blocks
          with the variable system to wire data flow.
        </p>
      </div>

      {/* Scrolling Rows */}
      <div
        className={`space-y-3 transition-all delay-300 duration-1000 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {blockRows.map((row, rowIndex) => (
          <div key={rowIndex} className='relative'>
            <div className='pointer-events-none absolute top-0 bottom-0 left-0 z-10 w-24 bg-gradient-to-r from-[#060606] to-transparent sm:w-40' />
            <div className='pointer-events-none absolute top-0 right-0 bottom-0 z-10 w-24 bg-gradient-to-l from-[#060606] to-transparent sm:w-40' />

            <div
              className={`flex gap-3 ${
                rowIndex % 2 === 0 ? 'animate-scroll-blocks-left' : 'animate-scroll-blocks-right'
              }`}
              style={{ width: 'max-content' }}
            >
              {[...row, ...row, ...row].map((block, blockIndex) => (
                <BlockCard key={`${rowIndex}-${blockIndex}`} {...block} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
