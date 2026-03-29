import { Container, Img, Link, Section, Text } from '@react-email/components'
import { getBrandConfig } from '@/lib/branding/branding'
import { env } from '@/lib/env'
import { getAssetUrl } from '@/lib/utils'

interface UnsubscribeOptions {
  unsubscribeToken?: string
  email?: string
}

interface EmailFooterProps {
  baseUrl?: string
  unsubscribe?: UnsubscribeOptions
}

export const EmailFooter = ({
  baseUrl = env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000/',
  unsubscribe,
}: EmailFooterProps) => {
  const brand = getBrandConfig()

  const footerStyles = {
    container: {
      backgroundColor: '#ffffff',
      borderTop: '1px solid #e2e8f0',
      padding: '40px 20px',
      textAlign: 'center' as const,
    },
    socialContainer: {
      backgroundColor: 'transparent',
      borderRadius: '12px',
      padding: '24px',
      marginBottom: '32px',
      border: '1px solid #e2e8f0',
    },
    socialTitle: {
      fontSize: '16px',
      fontWeight: '600',
      color: '#374151',
      margin: '0 0 16px 0',
    },
    socialIcon: {
      margin: '0 12px',
      padding: '8px',
      borderRadius: '8px',
      backgroundColor: '#f8fafc',
      transition: 'all 0.2s ease',
      display: 'inline-block',
    },
    companyInfo: {
      fontSize: '14px',
      color: '#6b7280',
      margin: '0 0 16px 0',
      lineHeight: '1.6',
    },
    supportText: {
      fontSize: '13px',
      color: '#9ca3af',
      margin: '0 0 20px 0',
      backgroundColor: 'transparent',
      padding: '16px',
      borderRadius: '8px',
      border: '1px solid #e5e7eb',
    },
    linksContainer: {
      backgroundColor: 'transparent',
      borderRadius: '8px',
      padding: '16px',
      border: '1px solid #e5e7eb',
    },
    linkStyle: {
      color: '#F97316',
      textDecoration: 'underline',
      fontWeight: '500',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    footerText: {
      fontSize: '12px',
      color: '#9ca3af',
      margin: '0',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
  }

  return (
    <Container>
      <Section style={footerStyles.container}>
        {/* Social Media Section */}
        <Section style={footerStyles.socialContainer}>
          <Text style={footerStyles.socialTitle}>🌟 Connect with {brand.name}</Text>
          <Section style={{ textAlign: 'center' }}>
            <Link
              href='https://x.com/zelaxyai'
              rel='noopener noreferrer'
              style={footerStyles.socialIcon}
            >
              <Img
                src={getAssetUrl('static/x-icon.png')}
                width='20'
                height='20'
                alt='X (Twitter)'
              />
            </Link>
            <Link
              href='https://discord.gg/zelaxy'
              rel='noopener noreferrer'
              style={footerStyles.socialIcon}
            >
              <Img
                src={getAssetUrl('static/discord-icon.png')}
                width='20'
                height='20'
                alt='Discord Community'
              />
            </Link>
            <Link
              href='https://github.com/zelaxy/zelaxy'
              rel='noopener noreferrer'
              style={footerStyles.socialIcon}
            >
              <Img
                src={getAssetUrl('static/github-icon.png')}
                width='20'
                height='20'
                alt='GitHub Repository'
              />
            </Link>
          </Section>
        </Section>

        {/* Company Information */}
        <Text style={footerStyles.companyInfo}>
          <strong>{brand.name}</strong> - Building the future of intelligent workflows
          <br />
          Empowering teams to create, automate, and optimize their processes with AI
        </Text>

        {/* Support Information */}
        <Section style={footerStyles.supportText}>
          <Text style={{ margin: '0', fontSize: '13px', color: '#6b7280' }}>
            💬 Need help? We're here for you!
            <br />
            Contact our support team at{' '}
            <Link href={`mailto:${brand.supportEmail}`} style={footerStyles.linkStyle}>
              {brand.supportEmail}
            </Link>
          </Text>
        </Section>

        {/* Legal Links */}
        <Section style={footerStyles.linksContainer}>
          <Text style={footerStyles.footerText}>
            <Link href={`${baseUrl}/privacy`} style={footerStyles.linkStyle}>
              Privacy Policy
            </Link>
            {' • '}
            <Link href={`${baseUrl}/terms`} style={footerStyles.linkStyle}>
              Terms of Service
            </Link>
            {' • '}
            <Link
              href={
                unsubscribe?.unsubscribeToken && unsubscribe?.email
                  ? `${baseUrl}/unsubscribe?token=${unsubscribe.unsubscribeToken}&email=${encodeURIComponent(unsubscribe.email)}`
                  : `mailto:${brand.supportEmail}?subject=Unsubscribe%20Request&body=Please%20unsubscribe%20me%20from%20all%20emails.`
              }
              style={footerStyles.linkStyle}
            >
              Unsubscribe
            </Link>
          </Text>
        </Section>

        {/* Copyright */}
        <Text style={{ ...footerStyles.footerText, marginTop: '24px', opacity: 0.8 }}>
          © {new Date().getFullYear()} {brand.name}. All rights reserved.
          <br />
          Made with ❤️ for intelligent automation
        </Text>
      </Section>
    </Container>
  )
}

export default EmailFooter
