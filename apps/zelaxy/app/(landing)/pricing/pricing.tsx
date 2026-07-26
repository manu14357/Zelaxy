'use client'

import '@/app/(landing)/components/blueprint.css'

import {
  Check,
  Database,
  HeadphonesIcon,
  type LucideIcon,
  MessageSquare,
  Minus,
  Rocket,
  Server,
  Sparkles,
  Users,
  Workflow,
  Zap,
} from 'lucide-react'
import Link from 'next/link'
import { RAZORPAY_PLAN_PRICING } from '@/lib/billing/razorpay-pricing'
import { cn } from '@/lib/utils'
import { AnnouncementBar } from '@/app/(landing)/components/announcement-bar'
import { Reveal, SectionTag } from '@/app/(landing)/components/blueprint/primitives'
import { Footer } from '@/app/(landing)/components/footer'
import { Navigation } from '@/app/(landing)/components/navigation'

// Same Typeform used by the in-app "Contact Us" enterprise CTA
// (see subscription-modal.tsx) - kept in sync deliberately.
const CONTACT_URL = 'https://form.typeform.com/to/jqCO12pF'

// INR amounts formatted with Indian digit grouping (₹1,999, not ₹1999).
const inr = (amount: number) => `₹${new Intl.NumberFormat('en-IN').format(amount)}`

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
  href: string
  highlight?: boolean
}

// Every value below is drawn from the actual plan configuration, so this page
// can't drift from what the product enforces:
//  - INR prices: lib/billing/razorpay-pricing.ts (what Razorpay charges).
//  - Included monthly usage ($10 / $20 / $40-seat): lib/billing/plan-defaults.ts.
//  - Rate limits (sync/async per minute): lib/env.ts RATE_LIMIT_* defaults.
//  - Sharing / multiplayer / workspace-collaboration flags:
//    lib/billing/plan-defaults.ts PLAN_FEATURE_LIMITS.
// Free is the default every account starts on (not a purchasable subscription).
const PLANS: Plan[] = [
  {
    name: 'Free',
    price: inr(0),
    period: 'forever',
    description: 'For trying Zelaxy and small personal projects.',
    features: [
      { text: '$10 of monthly usage included', icon: Sparkles },
      { text: '10 / 50 runs per min (sync / async)', icon: Zap },
      { text: 'Core blocks & integrations', icon: Workflow },
      { text: 'Community support', icon: MessageSquare },
    ],
    ctaLabel: 'Start free',
    href: '/signup',
  },
  {
    name: 'Pro',
    price: inr(RAZORPAY_PLAN_PRICING.pro.priceInr),
    period: RAZORPAY_PLAN_PRICING.pro.period,
    description: 'For builders shipping production workflows solo.',
    features: [
      { text: '$20 of monthly usage included', icon: Sparkles },
      { text: '25 / 200 runs per min (sync / async)', icon: Zap },
      { text: 'Sharing enabled', icon: Users },
      { text: 'Unlimited log retention', icon: Database },
    ],
    ctaLabel: 'Get Pro',
    href: '/signup?plan=pro',
    highlight: true,
  },
  {
    name: 'Team',
    price: inr(RAZORPAY_PLAN_PRICING.team.priceInr),
    period: RAZORPAY_PLAN_PRICING.team.period,
    description: 'For teams building and running agents together.',
    features: [
      { text: '$40 of monthly usage per seat', icon: Sparkles },
      { text: '75 / 500 runs per min (sync / async)', icon: Zap },
      { text: 'Real-time multiplayer & collaboration', icon: Users },
      { text: 'Dedicated Slack channel', icon: MessageSquare },
    ],
    ctaLabel: 'Get Team',
    href: '/signup?plan=team',
  },
]

type Cell = string | boolean

interface CompareRow {
  label: string
  free: Cell
  pro: Cell
  team: Cell
}

// The honest feature matrix - same sources as PLANS above. A boolean renders as
// a check/dash; a string renders as-is.
const COMPARISON: CompareRow[] = [
  { label: 'Included usage / month', free: '$10', pro: '$20', team: '$40 / seat' },
  { label: 'Sync runs / minute', free: '10', pro: '25', team: '75' },
  { label: 'Async runs / minute', free: '50', pro: '200', team: '500' },
  { label: 'Workspaces & workflows', free: 'Unlimited', pro: 'Unlimited', team: 'Unlimited' },
  { label: 'Log retention', free: 'Limited', pro: 'Unlimited', team: 'Unlimited' },
  { label: 'Sharing', free: false, pro: true, team: true },
  { label: 'Real-time multiplayer', free: false, pro: false, team: true },
  { label: 'Workspace collaboration', free: false, pro: false, team: true },
  { label: 'Seats', free: '1', pro: '1', team: 'Per seat' },
  { label: 'Support', free: 'Community', pro: 'Standard', team: 'Dedicated Slack' },
  { label: 'Self-host (MIT-licensed)', free: true, pro: true, team: true },
]

const ENTERPRISE_FEATURES: PlanFeature[] = [
  { text: 'Custom rate limits', icon: Zap },
  { text: 'Enterprise hosting license', icon: Server },
  { text: 'Custom enterprise support', icon: HeadphonesIcon },
]

const FAQ = [
  {
    q: 'Is there a free plan?',
    a: 'Yes — every account starts on the Free plan with $10 of monthly usage included and no card required. Upgrade to Pro or Team anytime from Settings → Subscription when you need higher rate limits, collaboration, or more usage.',
  },
  {
    q: 'How does usage-based billing work?',
    a: 'Each plan includes a monthly base of usage (metered in USD credit). If your workflows use more than that, the overage is billed automatically — a Razorpay payment link, sent by email and shown in-app — at the end of your billing period. No throttling, no surprise lock-outs.',
  },
  {
    q: 'Can I change plans later?',
    a: 'Yes. Upgrade, downgrade, or cancel anytime from Settings → Subscription inside the app. Payments are processed securely via Razorpay.',
  },
  {
    q: 'Do you offer self-hosting?',
    a: 'Zelaxy is MIT-licensed and fully self-hostable — run it in your own cloud or on-prem with no billing enforcement required. See the docs for deployment guides.',
  },
  {
    q: 'What counts as a "run"?',
    a: 'Each workflow execution — manual, scheduled, API-triggered, or webhook-triggered — counts as one run against your rate limit.',
  },
]

function CompareValue({ value, accent }: { value: Cell; accent?: boolean }) {
  if (value === true) {
    return (
      <Check className={cn('mx-auto h-4 w-4', accent ? 't-accent' : 't-ink')} strokeWidth={2.5} />
    )
  }
  if (value === false) {
    return <Minus className='t-faint mx-auto h-4 w-4' />
  }
  return <span className={cn(accent ? 't-ink font-medium' : 't-dim')}>{value}</span>
}

export default function Pricing() {
  return (
    <main className='s-bg t-ink relative min-h-screen overflow-x-hidden'>
      <AnnouncementBar />
      <Navigation />

      {/* Hero — top padding tracks the announcement bar height (--bp-ann-h) so
          the content always clears the fixed announcement + nav. */}
      <section className='relative pt-[calc(var(--bp-ann-h,0px)+6rem)] pb-10 sm:pt-[calc(var(--bp-ann-h,0px)+7rem)] sm:pb-14'>
        <div className='bp-grid-field pointer-events-none absolute inset-0 opacity-100' />
        <div className='relative mx-auto max-w-[1320px] px-5 sm:px-8'>
          <Reveal>
            <SectionTag id='09' name='Pricing' coord='Usage-based · cancel anytime' />
          </Reveal>
          <Reveal delay={0.06}>
            <h1 className='t-ink bp-display mt-6 max-w-3xl font-semibold text-[clamp(2.2rem,5.5vw,4rem)] leading-[1.05]'>
              Pay for what you <span className='t-accent'>run.</span>
            </h1>
          </Reveal>
          <Reveal delay={0.12}>
            <p className='t-dim mt-5 max-w-xl text-[16px] leading-relaxed'>
              Every plan bundles a monthly base of usage. Go over it and we bill the overage
              automatically at period end — no throttling, no surprise bills.
            </p>
          </Reveal>
          <Reveal delay={0.16}>
            <p className='t-faint mt-4 flex items-center gap-2 text-[13px]'>
              <Rocket className='h-3.5 w-3.5' />
              Start free, no card required — upgrade anytime.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Plan cards */}
      <section className='relative pb-8'>
        <div className='hair absolute inset-x-0 top-0 h-px' />
        <div className='mx-auto max-w-[1320px] px-5 sm:px-8'>
          <div className='grid grid-cols-1 gap-5 md:grid-cols-3'>
            {PLANS.map((plan, i) => (
              <Reveal key={plan.name} delay={i * 0.06}>
                <div
                  className={cn(
                    's-panel relative flex h-full flex-col rounded-2xl border p-7',
                    plan.highlight ? 'b-accent' : 'b-hair'
                  )}
                >
                  {plan.highlight && (
                    <span className='s-accent absolute top-6 right-6 rounded-full px-2.5 py-1 font-bold font-mono text-[#1c0c00] text-[10px] uppercase tracking-[0.14em]'>
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
                    href={plan.href}
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

      {/* Comparison table */}
      <section className='relative py-16 sm:py-20'>
        <div className='hair absolute inset-x-0 top-0 h-px' />
        <div className='mx-auto max-w-[1320px] px-5 sm:px-8'>
          <Reveal>
            <SectionTag id='10' name='Compare' coord='Free · Pro · Team' />
          </Reveal>
          <Reveal delay={0.06}>
            <div className='b-hair s-panel mt-8 overflow-hidden rounded-2xl border'>
              {/* Wide table scrolls within its own container on small screens. */}
              <div className='overflow-x-auto'>
                <table className='w-full min-w-[640px] border-collapse text-[13px]'>
                  <thead>
                    <tr className='b-hair border-b'>
                      <th className='t-dim px-5 py-4 text-left font-medium'>What you get</th>
                      <th className='t-ink px-4 py-4 text-center font-semibold'>Free</th>
                      <th className='px-4 py-4 text-center'>
                        <span className='t-accent font-semibold'>Pro</span>
                        <span className='s-accent ml-2 inline-block rounded-full px-2 py-0.5 align-middle font-bold font-mono text-[#1c0c00] text-[9px] uppercase tracking-[0.1em]'>
                          Popular
                        </span>
                      </th>
                      <th className='t-ink px-4 py-4 text-center font-semibold'>Team</th>
                    </tr>
                  </thead>
                  <tbody>
                    {COMPARISON.map((row) => (
                      <tr key={row.label} className='b-hair border-t'>
                        <td className='t-dim px-5 py-3.5'>{row.label}</td>
                        <td className='px-4 py-3.5 text-center'>
                          <CompareValue value={row.free} />
                        </td>
                        <td className='px-4 py-3.5 text-center'>
                          <CompareValue value={row.pro} accent />
                        </td>
                        <td className='px-4 py-3.5 text-center'>
                          <CompareValue value={row.team} />
                        </td>
                      </tr>
                    ))}
                    <tr className='b-hair border-t'>
                      <td className='px-5 py-5' />
                      <td className='px-4 py-5 text-center'>
                        <Link
                          href='/signup'
                          className='btn-ghost inline-flex h-9 items-center justify-center rounded-lg px-4 font-medium text-[13px]'
                        >
                          Start free
                        </Link>
                      </td>
                      <td className='px-4 py-5 text-center'>
                        <Link
                          href='/signup?plan=pro'
                          className='btn-accent inline-flex h-9 items-center justify-center rounded-lg px-4 font-medium text-[13px]'
                        >
                          Get Pro
                        </Link>
                      </td>
                      <td className='px-4 py-5 text-center'>
                        <Link
                          href='/signup?plan=team'
                          className='btn-ghost inline-flex h-9 items-center justify-center rounded-lg px-4 font-medium text-[13px]'
                        >
                          Get Team
                        </Link>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <p className='t-faint mt-4 text-[12px] leading-relaxed'>
              Usage is metered in USD credit ($0.005 per run + model cost); any overage is billed in
              ₹ via Razorpay at period end. Rate limits and feature access come straight from the
              product configuration.
            </p>
          </Reveal>
        </div>
      </section>

      {/* FAQ */}
      <section className='relative py-16 sm:py-24'>
        <div className='hair absolute inset-x-0 top-0 h-px' />
        <div className='mx-auto max-w-3xl px-5 sm:px-8'>
          <Reveal>
            <SectionTag id='11' name='FAQ' coord={`${FAQ.length} questions`} />
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
