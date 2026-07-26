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

interface GrantedWorkspace {
  workspaceName: string
  permission?: 'admin' | 'write' | 'read'
}

interface WorkspaceAddedEmailProps {
  inviterName?: string
  workspaces?: GrantedWorkspace[]
  appUrl?: string
}

const baseUrl = getEmailBaseUrl()

const getPermissionLabel = (permission?: string) => {
  switch (permission) {
    case 'admin':
      return 'Admin (full access)'
    case 'write':
      return 'Editor (can edit workflows)'
    case 'read':
      return 'Viewer (read-only access)'
    default:
      return null
  }
}

/**
 * Sent when a user is granted workspace access directly (the "direct-grant fast path") —
 * i.e. they were already a member of the owning organization, so there's nothing to accept:
 * this is a notification, not an invitation. No token, no accept link, no expiry.
 */
export const WorkspaceAddedEmail = ({
  inviterName = 'A team member',
  workspaces = [],
  appUrl,
}: WorkspaceAddedEmailProps) => {
  const brand = getBrandConfig()
  const link = appUrl || `${baseUrl}/arena`
  const names = workspaces.map((w) => w.workspaceName)
  const workspaceList =
    names.length <= 1
      ? names[0] || 'a workspace'
      : names.length === 2
        ? `${names[0]} and ${names[1]}`
        : `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`

  return (
    <Html>
      <Head />
      <Body style={baseStyles.main}>
        <Preview>You now have access to {workspaceList} on Zelaxy</Preview>
        <Container style={baseStyles.container}>
          <Section style={{ padding: '30px 0', textAlign: 'center' }}>
            <Row>
              <Column style={{ textAlign: 'center' }}>
                <Img
                  src={getEmailLogoUrl()}
                  width='114'
                  alt={brand.name}
                  style={{
                    margin: '0 auto',
                  }}
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
            <Text style={baseStyles.paragraph}>Hello,</Text>
            <Text style={baseStyles.paragraph}>
              {inviterName} has given you access to the following workspace
              {workspaces.length !== 1 ? 's' : ''} on Zelaxy:
            </Text>
            {workspaces.map((ws) => (
              <Text key={ws.workspaceName} style={{ ...baseStyles.paragraph, margin: '4px 0' }}>
                • <strong>{ws.workspaceName}</strong>
                {getPermissionLabel(ws.permission) ? ` — ${getPermissionLabel(ws.permission)}` : ''}
              </Text>
            ))}
            <Text style={baseStyles.paragraph}>
              Since you're already a member of the team on Zelaxy, no action is needed — you have
              access right away.
            </Text>
            <Link href={link} style={{ textDecoration: 'none' }}>
              <Text style={baseStyles.button}>Open Zelaxy</Text>
            </Link>
            <Text style={baseStyles.paragraph}>
              Best regards,
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

export default WorkspaceAddedEmail
