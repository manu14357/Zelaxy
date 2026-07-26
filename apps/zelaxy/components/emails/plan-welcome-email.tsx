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

interface PlanWelcomeEmailProps {
  name?: string
  /** Display plan name, e.g. "Pro" or "Team". */
  planLabel?: string
  appUrl?: string
  docsUrl?: string
}

const baseUrl = getEmailBaseUrl()

// Combined welcome + getting-started email sent once, on first upgrade.
const GETTING_STARTED: { title: string; body: string }[] = [
  {
    title: 'Build your first workflow',
    body: 'Open the canvas and drag in a trigger, an agent, and a tool — Zelaxy runs the graph for you.',
  },
  {
    title: 'Invite your team',
    body: 'Share a workspace and collaborate on workflows in real time.',
  },
  {
    title: 'Connect your tools',
    body: 'Add credentials for the integrations your workflows need — they stay encrypted.',
  },
]

/**
 * Sent once when a user first upgrades to a paid plan (the created->active
 * transition). Welcomes them and points at the first things to do.
 */
export const PlanWelcomeEmail = ({
  name = 'there',
  planLabel = 'Pro',
  appUrl,
  docsUrl,
}: PlanWelcomeEmailProps) => {
  const brand = getBrandConfig()
  const link = appUrl || `${baseUrl}/arena`
  const docs = docsUrl || 'https://docs.zelaxy.in'

  return (
    <Html>
      <Head />
      <Body style={baseStyles.main}>
        <Preview>Welcome to Zelaxy {planLabel}</Preview>
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
              Welcome to Zelaxy {planLabel} 🎉
            </Text>
            <Text style={baseStyles.paragraph}>Hi {name},</Text>
            <Text style={baseStyles.paragraph}>
              Your {planLabel} plan is active — thanks for upgrading. Here's how to get the most out
              of it:
            </Text>

            {GETTING_STARTED.map((step) => (
              <Section key={step.title} style={{ margin: '10px 0' }}>
                <Text
                  style={{ ...baseStyles.paragraph, margin: '6px 0 2px 0', fontWeight: 'bold' }}
                >
                  {step.title}
                </Text>
                <Text style={{ ...baseStyles.paragraph, margin: '0', fontSize: '14px' }}>
                  {step.body}
                </Text>
              </Section>
            ))}

            <Link href={link} style={{ textDecoration: 'none' }}>
              <Text style={baseStyles.button}>Open Zelaxy</Text>
            </Link>

            <Text style={{ ...baseStyles.paragraph, fontSize: '14px' }}>
              New here? The{' '}
              <Link href={docs} style={baseStyles.link}>
                documentation
              </Link>{' '}
              walks through building and deploying your first workflow. Reply to this email if you
              need a hand.
            </Text>
            <Text style={baseStyles.paragraph}>
              Happy building,
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

export default PlanWelcomeEmail
