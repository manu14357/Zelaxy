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

export interface ReceiptLineItem {
  label: string
  value: string
}

interface BillingReceiptEmailProps {
  name?: string
  /** Short headline, e.g. "Payment received" or "Credits added". */
  heading?: string
  /** One-line summary shown under the heading. */
  intro?: string
  lineItems?: ReceiptLineItem[]
  /** The bold total row (e.g. "₹1,999"). */
  totalLabel?: string
  totalValue?: string
  ctaLabel?: string
  ctaUrl?: string
  /** Small print under the CTA (e.g. where to find invoices). */
  footnote?: string
}

const baseUrl = getEmailBaseUrl()

/**
 * Generic transactional receipt used for plan charges and credit purchases.
 * Zelaxy bills in INR via Razorpay - callers pre-format currency into the
 * line items and total.
 */
export const BillingReceiptEmail = ({
  name = 'there',
  heading = 'Payment received',
  intro = 'Thanks for your payment. Here are the details for your records.',
  lineItems = [],
  totalLabel = 'Total paid',
  totalValue,
  ctaLabel = 'View billing',
  ctaUrl,
  footnote = 'You can view all your invoices anytime in Settings → Subscription.',
}: BillingReceiptEmailProps) => {
  const brand = getBrandConfig()
  const link = ctaUrl || `${baseUrl}/arena`

  return (
    <Html>
      <Head />
      <Body style={baseStyles.main}>
        <Preview>{heading} — Zelaxy</Preview>
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
              {heading}
            </Text>
            <Text style={baseStyles.paragraph}>Hi {name},</Text>
            <Text style={baseStyles.paragraph}>{intro}</Text>

            <Section
              style={{
                margin: '20px 0',
                padding: '8px 16px',
                backgroundColor: '#f8f9fa',
                borderRadius: '5px',
                border: '1px solid #eee',
              }}
            >
              {lineItems.map((item) => (
                <Row key={item.label} style={{ padding: '6px 0' }}>
                  <Column style={{ fontSize: '14px', color: '#666666' }}>{item.label}</Column>
                  <Column
                    style={{
                      fontSize: '14px',
                      color: '#333333',
                      textAlign: 'right',
                      fontWeight: 500,
                    }}
                  >
                    {item.value}
                  </Column>
                </Row>
              ))}
              {totalValue ? (
                <Row style={{ padding: '10px 0 4px 0', borderTop: '1px solid #eee' }}>
                  <Column style={{ fontSize: '15px', color: '#333333', fontWeight: 'bold' }}>
                    {totalLabel}
                  </Column>
                  <Column
                    style={{
                      fontSize: '15px',
                      color: '#333333',
                      textAlign: 'right',
                      fontWeight: 'bold',
                    }}
                  >
                    {totalValue}
                  </Column>
                </Row>
              ) : null}
            </Section>

            <Link href={link} style={{ textDecoration: 'none' }}>
              <Text style={baseStyles.button}>{ctaLabel}</Text>
            </Link>

            <Text style={{ ...baseStyles.paragraph, fontSize: '13px', color: '#666666' }}>
              {footnote}
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

export default BillingReceiptEmail
