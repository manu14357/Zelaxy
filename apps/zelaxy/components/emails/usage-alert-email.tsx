import {
  Body,
  Column,
  Container,
  Head,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from '@react-email/components'
import { getBrandConfig } from '@/lib/branding/branding'
import { baseStyles } from './base-styles'
import { getEmailBaseUrl, getEmailLogoUrl } from './email-config'
import EmailFooter from './footer'

interface UsageAlertEmailProps {
  name?: string
  planLabel?: string
  /** Threshold crossed: 50 | 75 | 80 | 90 | 100. */
  percent?: number
  /** Optional exact usage figures (metering domain), pre-formatted. */
  usedLabel?: string
  limitLabel?: string
  appUrl?: string
}

const baseUrl = getEmailBaseUrl()
const ACCENT = '#F97316'

function headingFor(percent: number): string {
  if (percent >= 100) return "You've reached your monthly usage limit"
  return `You've used ${percent}% of your monthly usage`
}

function introFor(percent: number, planLabel: string): string {
  if (percent >= 100) {
    return `You've used all of your included ${planLabel} usage this billing period. Further usage is billed as overage via a Razorpay payment link at period end — no interruption, no throttling.`
  }
  if (percent >= 90) {
    return `You're close to your included ${planLabel} usage for this billing period. Once you pass 100%, extra usage is billed automatically as overage.`
  }
  return `A heads-up on your ${planLabel} usage this billing period so there are no surprises at period end.`
}

/**
 * Usage-threshold alert. Fired once per crossed threshold per billing period
 * (50/75/80/90/100%) from the metering path, alongside the in-app notification.
 */
export const UsageAlertEmail = ({
  name = 'there',
  planLabel = 'Free',
  percent = 80,
  usedLabel,
  limitLabel,
  appUrl,
}: UsageAlertEmailProps) => {
  const brand = getBrandConfig()
  const link = appUrl || `${baseUrl}/arena`
  const clamped = Math.max(0, Math.min(100, percent))
  const barColor = clamped >= 90 ? '#dc2626' : clamped >= 75 ? ACCENT : '#f59e0b'

  return (
    <Html>
      <Head />
      <Body style={baseStyles.main}>
        <Preview>{headingFor(percent)} — Zelaxy</Preview>
        <Container style={baseStyles.container}>
          <Section style={{ padding: '30px 0', textAlign: 'center' }}>
            <Row>
              <Column style={{ textAlign: 'center' }}>
                <Img
                  src={getEmailLogoUrl()}
                  width='114'
                  alt={brand.name}
                  style={{ margin: '0 auto' }}
                />
              </Column>
            </Row>
          </Section>

          <Section style={baseStyles.sectionsBorders}>
            <Row>
              <Column style={baseStyles.sectionBorder} />
              <Column style={baseStyles.sectionCenter} />
              <Column style={baseStyles.sectionBorder} />
            </Row>
          </Section>

          <Section style={baseStyles.content}>
            <Text style={{ ...baseStyles.paragraph, fontSize: '20px', fontWeight: 'bold' }}>
              {headingFor(percent)}
            </Text>
            <Text style={baseStyles.paragraph}>Hi {name},</Text>
            <Text style={baseStyles.paragraph}>{introFor(percent, planLabel)}</Text>

            {/* Usage bar */}
            <Section style={{ margin: '20px 0' }}>
              <Row>
                <Column
                  style={{
                    backgroundColor: '#eeeeee',
                    borderRadius: '999px',
                    height: '12px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${clamped}%`,
                      backgroundColor: barColor,
                      height: '12px',
                      borderRadius: '999px',
                    }}
                  />
                </Column>
              </Row>
              <Text style={{ ...baseStyles.paragraph, margin: '8px 0 0 0', fontSize: '13px' }}>
                {clamped}% used
                {usedLabel && limitLabel ? ` · ${usedLabel} of ${limitLabel}` : ''} · {planLabel}{' '}
                plan
              </Text>
            </Section>

            <Link href={link} style={{ textDecoration: 'none' }}>
              <Text style={baseStyles.button}>
                {planLabel === 'Free' ? 'Upgrade for more usage' : 'Manage usage & billing'}
              </Text>
            </Link>

            <Text style={{ ...baseStyles.paragraph, fontSize: '13px', color: '#666666' }}>
              You can raise your limit, buy prepaid credits, or upgrade anytime in Settings →
              Subscription.
            </Text>
            <Text style={baseStyles.paragraph}>
              Thanks,
              <br />
              The Zelaxy Team
            </Text>
          </Section>
        </Container>

        <EmailFooter baseUrl={baseUrl} />
      </Body>
    </Html>
  )
}

export default UsageAlertEmail
