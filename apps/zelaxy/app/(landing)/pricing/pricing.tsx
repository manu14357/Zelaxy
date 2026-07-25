'use client'

import '@/app/(landing)/components/blueprint.css'

import {
  Building2,
  Clock,
  Database,
  HeadphonesIcon,
  Infinity as InfinityIcon,
  type LucideIcon,
  MessageSquare,
  Server,
  Users,
  Workflow,
  Zap,
} from 'lucide-react'
import Link from 'next/link'
import { RAZORPAY_PLAN_PRICING } from '@/lib/billing/razorpay-pricing'
import { cn } from '@/lib/utils'
import { Reveal, SectionTag } from '@/app/(landing)/components/blueprint/primitives'
import { Footer } from '@/app/(landing)/components/footer'
import { Navigation } from '@/app/(landing)/components/navigation'

// Same Typeform used by the in-app "Contact Us" enterprise CTA
// (see subscription-modal.tsx) - kept in sync deliberately.
const CONTACT_URL = 'https://form.typeform.com/to/jqCO12pF'

interface PlanFeature {
  text: string
  icon: LucideIcon
}

interface Plan {
  name: string
  price: string
  period: string
  description: string
  features: PlanFeature[]
  ctaLabel: string
  highlight?: boolean
}

// Prices and feature copy mirror the in-app upgrade modal
// (subscription-modal.tsx) so the two never silently drift apart. Amounts
// come from RAZORPAY_PLAN_PRICING - the same INR prices actually charged via
// the Razorpay subscription mandate. No Free tier - it isn't a purchasable
// subscription, so there's nothing to list here for it.
const PLANS: Plan[] = [
  {
    name: 'Pro',
    price: `₹${RAZORPAY_PLAN_PRICING.pro.priceInr}`,
    period: RAZORPAY_PLAN_PRICING.pro.period,
    description: 'For builders shipping production workflows solo.',
    features: [
      { text: '25 runs per minute (sync)', icon: Zap },
      { text: '200 runs per minute (async)', icon: Clock },
      { text: 'Unlimited workspaces', icon: Building2 },
      { text: 'Unlimited workflows', icon: Workflow },
      { text: 'Unlimited invites', icon: Users },
      { text: 'Unlimited log retention', icon: Database },
    ],
    ctaLabel: 'Start Building',
    highlight: true,
  },
  {
    name: 'Team',
    price: `₹${RAZORPAY_PLAN_PRICING.team.priceInr}`,
    period: RAZORPAY_PLAN_PRICING.team.period,
    description: 'For teams building and running agents together.',
    features: [
      { text: '75 runs per minute (sync)', icon: Zap },
      { text: '500 runs per minute (async)', icon: Clock },
      { text: 'Everything in Pro', icon: InfinityIcon },
      { text: 'Dedicated Slack channel', icon: MessageSquare },
    ],
    ctaLabel: 'Start Building',
  },
]

const ENTERPRISE_FEATURES: PlanFeature[] = [
  { text: 'Custom rate limits', icon: Zap },
  { text: 'Enterprise hosting license', icon: Server },
  { text: 'Custom enterprise support', icon: HeadphonesIcon },
]

const FAQ = [
  {
    q: 'How does usage-based billing work?',
    a: 'Every plan includes a monthly base of inference credit. If your workflows use more than that, the overage is billed automatically (a Razorpay payment link, sent by email and shown in-app) at the end of your billing period - no throttling, no surprise lock-outs.',
  },
  {
    q: 'Can I change plans later?',
    a: 'Yes. Upgrade, downgrade, or cancel anytime from Settings → Subscription inside the app. Payments are processed securely via Razorpay.',
  },
  {
    q: 'Do you offer self-hosting?',
    a: 'Zelaxy is MIT-licensed and fully self-hostable - run it in your own cloud or on-prem with no billing enforcement required. See the docs for deployment guides.',
  },
  {
    q: 'What happens if I exceed my usage limit?',
    a: 'Overage is billed automatically via a Razorpay payment link once your usage crosses your plan’s included budget.',
  },
  {
    q: 'What counts as a "run"?',
    a: 'Each workflow execution - manual, scheduled, API-triggered, or webhook-triggered - counts as one run against your rate limit.',
  },
]

export default function Pricing() {
  return (
    <main className='s-bg t-ink relative min-h-screen overflow-x-hidden'>
      <Navigation />

      {/* Hero */}
      <section className='relative pt-36 pb-16 sm:pt-44 sm:pb-20'>
        <div className='bp-grid-field pointer-events-none absolute inset-0 opacity-40' />
        <div className='relative mx-auto max-w-[1320px] px-5 sm:px-8'>
          <Reveal>
            <SectionTag id='09' name='Pricing' coord='Usage-based · cancel anytime' />
          </Reveal>
          <Reveal delay={0.06}>
            <h1 className='t-ink bp-display mt-8 max-w-3xl font-semibold text-[clamp(2.4rem,6vw,4.4rem)] leading-[1.05]'>
              Pay for what you <span className='t-accent'>run.</span>
            </h1>
          </Reveal>
          <Reveal delay={0.12}>
            <p className='t-dim mt-6 max-w-xl text-[17px] leading-relaxed'>
              Every plan bundles a monthly base of inference credit. Go over it and we bill the
              overage automatically at period end - no throttling, no surprise bills.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Plan cards */}
      <section className='relative pb-8'>
        <div className='hair absolute inset-x-0 top-0 h-px' />
        <div className='mx-auto max-w-[1320px] px-5 sm:px-8'>
          <div className='grid grid-cols-1 gap-5 lg:grid-cols-2'>
            {PLANS.map((plan, i) => (
              <Reveal key={plan.name} delay={i * 0.06}>
                <div
                  className={cn(
                    's-panel relative flex h-full flex-col rounded-2xl border p-7',
                    plan.highlight ? 'b-accent' : 'b-hair'
                  )}
                >
                  {plan.highlight && (
                    <span className='bp-label s-accent absolute top-7 right-7 rounded-full px-2.5 py-1 text-[#1c0c00] text-[10px]'>
                      Popular
                    </span>
                  )}
                  <h2 className='t-ink font-semibold text-[20px]'>{plan.name}</h2>
                  <p className='t-dim mt-2 text-[13px] leading-relaxed'>{plan.description}</p>
                  <div className='mt-6 flex items-baseline gap-1.5'>
                    <span className='t-ink bp-display font-semibold text-[clamp(2rem,3vw,2.6rem)]'>
                      {plan.price}
                    </span>
                    <span className='t-faint text-[13px]'>{plan.period}</span>
                  </div>

                  <Link
                    href='/arena'
                    className={cn(
                      'mt-6 inline-flex h-10 items-center justify-center rounded-lg px-5 font-medium text-[14px]',
                      plan.highlight ? 'btn-accent' : 'btn-ghost'
                    )}
                  >
                    {plan.ctaLabel}
                  </Link>

                  <ul className='b-hair mt-7 space-y-3 border-t pt-6'>
                    {plan.features.map((f) => (
                      <li key={f.text} className='flex items-start gap-2.5 text-[13px]'>
                        <f.icon className='t-faint mt-0.5 h-3.5 w-3.5 shrink-0' />
                        <span className='t-dim'>{f.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            ))}
          </div>

          {/* Enterprise banner */}
          <Reveal delay={0.2}>
            <div className='b-hair s-panel mt-5 flex flex-col gap-6 rounded-2xl border p-7 md:flex-row md:items-center md:justify-between'>
              <div>
                <h2 className='t-ink font-semibold text-[20px]'>Enterprise</h2>
                <p className='t-dim mt-2 max-w-md text-[13px] leading-relaxed'>
                  Custom limits, self-hosted or on-prem deployment, and dedicated support for teams
                  running Zelaxy at scale.
                </p>
              </div>
              <div className='flex flex-wrap items-center gap-x-6 gap-y-3'>
                {ENTERPRISE_FEATURES.map((f, i) => (
                  <div key={f.text} className='flex items-center gap-4'>
                    <div className='flex items-center gap-2 text-[13px]'>
                      <f.icon className='t-faint h-3.5 w-3.5' />
                      <span className='t-dim'>{f.text}</span>
                    </div>
                    {i < ENTERPRISE_FEATURES.length - 1 && <span className='hair h-4 w-px' />}
                  </div>
                ))}
              </div>
              <a
                href={CONTACT_URL}
                target='_blank'
                rel='noopener noreferrer'
                className='btn-ghost inline-flex h-10 shrink-0 items-center justify-center rounded-lg px-5 font-medium text-[14px]'
              >
                Contact Us
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* FAQ */}
      <section className='relative py-24 sm:py-32'>
        <div className='hair absolute inset-x-0 top-0 h-px' />
        <div className='mx-auto max-w-3xl px-5 sm:px-8'>
          <Reveal>
            <SectionTag id='10' name='FAQ' coord={`${FAQ.length} questions`} />
          </Reveal>
          <div className='b-hair mt-10 divide-y overflow-hidden rounded-xl border'>
            {FAQ.map((item, i) => (
              <Reveal key={item.q} delay={i * 0.04}>
                <div className='p-6'>
                  <h3 className='t-ink font-medium text-[15px]'>{item.q}</h3>
                  <p className='t-dim mt-2 text-[14px] leading-relaxed'>{item.a}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
