import {
  Body,
  Column,
  Container,
  Head,
  Html,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from '@react-email/components'
import { format } from 'date-fns'
import { getBrandConfig } from '@/lib/branding/branding'
import { env } from '@/lib/env'
import EmailFooter from './footer'

interface ResetPasswordEmailProps {
  username?: string
  resetLink?: string
  updatedDate?: Date
}

const baseUrl = env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000/'

export const ResetPasswordEmail = ({
  username = '',
  resetLink = '',
  updatedDate = new Date(),
}: ResetPasswordEmailProps) => {
  const brand = getBrandConfig()

  const modernStyles = {
    main: {
      backgroundColor: '#ffffff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      margin: 0,
      padding: 0,
    },
    container: {
      backgroundColor: '#ffffff',
      border: '1px solid #e2e8f0',
      borderRadius: '16px',
      margin: '40px auto',
      maxWidth: '600px',
      overflow: 'hidden',
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    },
    header: {
      backgroundColor: '#ffffff',
      padding: '40px 30px',
      textAlign: 'center' as const,
      borderBottom: '1px solid #e2e8f0',
    },
    headerContent: {
      backgroundColor: 'transparent',
      borderRadius: '12px',
      padding: '30px',
    },
    logo: {
      width: '80px',
      height: '80px',
      margin: '0 auto 20px',
      backgroundColor: 'transparent',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    brandName: {
      color: '#1f2937',
      fontSize: '32px',
      fontWeight: '700',
      margin: '0',
    },
    subtitle: {
      color: '#6b7280',
      fontSize: '16px',
      margin: '8px 0 0 0',
      fontWeight: '400',
    },
    content: {
      padding: '50px 40px',
    },
    greeting: {
      fontSize: '24px',
      fontWeight: '600',
      color: '#1e293b',
      margin: '0 0 24px 0',
      lineHeight: '1.3',
    },
    paragraph: {
      fontSize: '16px',
      lineHeight: '1.6',
      color: '#475569',
      margin: '0 0 20px 0',
    },
    highlightBox: {
      backgroundColor: '#f1f5f9',
      border: '1px solid #e2e8f0',
      borderRadius: '12px',
      padding: '24px',
      margin: '32px 0',
      textAlign: 'center' as const,
    },
    securityNote: {
      fontSize: '14px',
      color: '#64748b',
      fontStyle: 'italic',
      margin: '0',
    },
    buttonContainer: {
      textAlign: 'center' as const,
      margin: '40px 0',
    },
    button: {
      backgroundColor: '#F97316',
      background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
      border: 'none',
      borderRadius: '12px',
      color: '#ffffff',
      display: 'inline-block',
      fontSize: '16px',
      fontWeight: '600',
      padding: '16px 32px',
      textDecoration: 'none',
      textAlign: 'center' as const,
      boxShadow: '0 4px 14px 0 rgba(249, 115, 22, 0.3)',
      transition: 'all 0.2s ease',
    },
    infoSection: {
      backgroundColor: '#fef3c7',
      border: '1px solid #fbbf24',
      borderRadius: '12px',
      padding: '20px',
      margin: '32px 0',
    },
    warningText: {
      fontSize: '14px',
      color: '#92400e',
      margin: '0',
      fontWeight: '500',
    },
    signature: {
      borderTop: '1px solid #e2e8f0',
      paddingTop: '32px',
      marginTop: '40px',
    },
    signatureText: {
      fontSize: '16px',
      color: '#374151',
      margin: '0 0 8px 0',
      fontWeight: '500',
    },
    teamName: {
      fontSize: '14px',
      color: '#6b7280',
      margin: '0',
    },
    footer: {
      backgroundColor: '#ffffff',
      padding: '30px 40px',
      borderTop: '1px solid #e2e8f0',
      textAlign: 'center' as const,
    },
    footerText: {
      fontSize: '12px',
      color: '#9ca3af',
      margin: '0',
      lineHeight: '1.5',
    },
  }

  return (
    <Html>
      <Head />
      <Body style={modernStyles.main}>
        <Preview>🔐 Password Reset Request for your {brand.name} account</Preview>
        <Container style={modernStyles.container}>
          {/* Modern Header with Gradient */}
          <Section style={modernStyles.header}>
            <Section style={modernStyles.headerContent}>
              <Row>
                <Column style={{ textAlign: 'center' }}>
                  <Section style={modernStyles.logo}>
                    <svg
                      width='40'
                      height='40'
                      viewBox='0 0 1440 810'
                      style={{ borderRadius: '50%' }}
                    >
                      <g transform='matrix(1, 0, 0, 1, 638, 323)'>
                        <g clipPath='url(#56c6404bd6)'>
                          <g clipPath='url(#940b1e3721)'>
                            <g clipPath='url(#bfa7cf22cc)'>
                              <path
                                fill='#008cfe'
                                d='M 0.308594 0.339844 L 162.308594 0.339844 L 162.308594 162.339844 L 0.308594 162.339844 Z M 0.308594 0.339844'
                                fillOpacity='1'
                                fillRule='nonzero'
                              />
                            </g>
                          </g>
                        </g>
                      </g>
                      <defs>
                        <clipPath id='56c6404bd6'>
                          <rect x='0' width='163' y='0' height='163' />
                        </clipPath>
                        <clipPath id='940b1e3721'>
                          <path
                            d='M 0.308594 0.339844 L 162.308594 0.339844 L 162.308594 162.339844 L 0.308594 162.339844 Z M 0.308594 0.339844'
                            clipRule='nonzero'
                          />
                        </clipPath>
                        <clipPath id='bfa7cf22cc'>
                          <path
                            d='M 0.308594 16.539062 L 0.308594 146.140625 C 0.308594 155.085938 7.5625 162.339844 16.511719 162.339844 L 146.109375 162.339844 C 155.058594 162.339844 162.308594 155.085938 162.308594 146.140625 L 162.308594 16.539062 C 162.308594 7.59375 155.058594 0.339844 146.109375 0.339844 L 16.511719 0.339844 C 7.5625 0.339844 0.308594 7.59375 0.308594 16.539062 Z M 0.308594 16.539062'
                            clipRule='nonzero'
                          />
                        </clipPath>
                      </defs>
                    </svg>
                  </Section>
                  <Text style={modernStyles.brandName}>{brand.name}</Text>
                  <Text style={modernStyles.subtitle}>Intelligent Workflow Platform</Text>
                </Column>
              </Row>
            </Section>
          </Section>

          {/* Main Content */}
          <Section style={modernStyles.content}>
            <Text style={modernStyles.greeting}>Hello {username || 'there'} 👋</Text>

            <Text style={modernStyles.paragraph}>
              We received a request to reset your password for your {brand.name} account. No worries
              - it happens to the best of us!
            </Text>

            <Section style={modernStyles.highlightBox}>
              <Text style={modernStyles.securityNote}>
                🔒 For your security, this password reset link is only valid for the next 24 hours.
              </Text>
            </Section>

            <Section style={modernStyles.buttonContainer}>
              <Link href={resetLink} style={modernStyles.button}>
                🔑 Reset Your Password
              </Link>
            </Section>

            <Text style={modernStyles.paragraph}>
              Once you click the button above, you'll be taken to a secure page where you can create
              a new password for your account.
            </Text>

            <Section style={modernStyles.infoSection}>
              <Text style={modernStyles.warningText}>
                ⚠️ If you didn't request this password reset, please ignore this email. Your account
                remains secure and no changes will be made.
              </Text>
            </Section>

            <Text style={modernStyles.paragraph}>
              If you're having trouble with the button above, you can copy and paste the following
              link into your browser:
            </Text>

            <Text
              style={{
                fontSize: '14px',
                color: '#F97316',
                wordBreak: 'break-all',
                backgroundColor: '#f1f5f9',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
              }}
            >
              {resetLink}
            </Text>

            <Section style={modernStyles.signature}>
              <Text style={modernStyles.signatureText}>Best regards,</Text>
              <Text style={modernStyles.teamName}>The {brand.name} Security Team</Text>
            </Section>
          </Section>

          {/* Footer */}
          <Section style={modernStyles.footer}>
            <Text style={modernStyles.footerText}>
              This email was sent on {format(updatedDate, 'MMMM do, yyyy')} at{' '}
              {format(updatedDate, 'h:mm a')}
              because a password reset was requested for your account.
            </Text>
            <Text style={{ ...modernStyles.footerText, marginTop: '8px' }}>
              {brand.name} - Building the future of intelligent workflows
            </Text>
          </Section>
        </Container>

        <EmailFooter baseUrl={baseUrl} />
      </Body>
    </Html>
  )
}

export default ResetPasswordEmail
