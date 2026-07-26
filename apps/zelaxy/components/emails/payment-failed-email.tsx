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

interface PaymentFailedEmailProps {
  name?: string
  /** Pre-formatted amount, e.g. "₹1,999". */
  amount?: string
  /** What failed: an overage payment link expiring, a renewal charge failing, etc. */
  reason?: string
  /** Where the user resolves it (billing settings / a fresh payment link). */
  actionUrl?: string
}

const baseUrl = getEmailBaseUrl()

/**
 * Dunning email: a charge failed (overage payment link expired, or an
 * auto-renewal charge could not be collected). Access may be on hold until it
 * is resolved.
 */
export const PaymentFailedEmail = ({
  name = 'there',
  amount,
  reason = 'A recent payment on your account could not be completed.',
  actionUrl,
}: PaymentFailedEmailProps) => {
  const brand = getBrandConfig()
  const link = actionUrl || `${baseUrl}/arena`

  return (
    <Html>
      <Head />
      <Body style={baseStyles.main}>
        <Preview>Action required: a payment on your Zelaxy account failed</Preview>
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
              Action required: payment failed
            </Text>
            <Text style={baseStyles.paragraph}>Hi {name},</Text>
            <Text style={baseStyles.paragraph}>{reason}</Text>
            {amount ? (
              <Text style={baseStyles.paragraph}>
                Amount outstanding: <strong>{amount}</strong>.
              </Text>
            ) : null}
            <Text style={baseStyles.paragraph}>
              To keep your account active, please resolve this from your billing settings. If a
              payment link expired, you can generate a new one there.
            </Text>

            <Link href={link} style={{ textDecoration: 'none' }}>
              <Text style={baseStyles.button}>Resolve billing</Text>
            </Link>

            <Text style={{ ...baseStyles.paragraph, fontSize: '13px', color: '#666666' }}>
              If you think this is a mistake, reply to this email and we'll help sort it out.
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

export default PaymentFailedEmail
