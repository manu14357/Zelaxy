'use client'

import { Counter, Reveal, SectionTag } from '@/app/(landing)/components/blueprint/primitives'

const SPECS = [
  ['Access', 'RBAC · read / write / admin'],
  ['Secrets', 'AES-256 encrypted at rest'],
  ['Isolation', 'Per-workspace multi-tenant'],
  ['Deploy', 'Cloud · Self-host · On-prem'],
  ['Audit', 'Immutable execution history'],
  ['Auth', 'SSO · OAuth · API keys'],
]

const PILLARS = [
  'Permissions',
  'Teams',
  'Projects',
  'Audit Trails',
  'Encrypted Secrets',
  'Private Deploys',
  'Environments',
  'Version Control',
  'Execution History',
  'Observability',
  'Analytics',
  'Rate Limits',
]

export function EnterpriseSection() {
  return (
    <section id='enterprise' className='s-bg relative py-28 sm:py-36'>
      <div className='hair absolute inset-x-0 top-0 h-px' />
      <div className='mx-auto max-w-[1320px] px-5 sm:px-8'>
        <Reveal>
          <SectionTag id='06' name='Enterprise' coord='SLA · 99.9%' />
        </Reveal>

        <div className='mt-12 grid grid-cols-1 gap-12 lg:grid-cols-[1fr_1fr] lg:gap-16'>
          {/* left: thesis + datasheet */}
          <div>
            <Reveal>
              <h2 className='t-ink bp-display font-semibold text-[clamp(2rem,4.6vw,3.4rem)]'>
                Built like
                <br />
                <span className='t-accent'>infrastructure.</span>
              </h2>
            </Reveal>
            <Reveal delay={0.1}>
              <p className='t-dim mt-6 max-w-md text-[16px] leading-relaxed'>
                Roles, secrets, environments and audit trails aren’t add-ons — they’re the
                substrate. Run Zelaxy in our cloud, your VPC, or fully on-prem.
              </p>
            </Reveal>

            <Reveal delay={0.16}>
              <dl className='b-hair mt-10 overflow-hidden rounded-xl border'>
                {SPECS.map(([k, v], i) => (
                  <div
                    key={k}
                    className={`grid grid-cols-[120px_1fr] items-center gap-4 px-5 py-3.5 ${i > 0 ? 'b-hair border-t' : ''}`}
                  >
                    <dt className='bp-label t-faint'>{k}</dt>
                    <dd className='t-dim font-blueprint text-[13px]'>{v}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>

          {/* right: stat readouts + pillars */}
          <div>
            <Reveal delay={0.06}>
              <div className='b-hair grid grid-cols-2 gap-px overflow-hidden rounded-xl border'>
                {[
                  { v: 256, suffix: '-bit', label: 'Secret encryption' },
                  { v: 250, suffix: '+', label: 'Integrations' },
                  { v: 3, suffix: '', label: 'Permission roles' },
                  { v: 100, suffix: '%', label: 'Self-hostable' },
                ].map((s) => (
                  <div key={s.label} className='s-panel p-6'>
                    <div className='t-ink font-semibold text-[clamp(1.8rem,4vw,2.6rem)] tracking-tight'>
                      <Counter to={s.v} suffix={s.suffix} />
                    </div>
                    <div className='t-faint bp-label mt-1'>{s.label}</div>
                  </div>
                ))}
              </div>
            </Reveal>

            <Reveal delay={0.12}>
              <div className='mt-6 flex flex-wrap gap-2'>
                {PILLARS.map((p) => (
                  <span
                    key={p}
                    className='chip s-panel b-hair t-dim rounded-md border px-3 py-1.5 text-[13px]'
                  >
                    {p}
                  </span>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  )
}
