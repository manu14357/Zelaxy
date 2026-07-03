'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { KeyRound, Loader2, Lock, Plus, Trash2 } from 'lucide-react'
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  CopyButton,
  Input,
  Label,
  Skeleton,
  Switch,
  Textarea,
} from '@/components/ui'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useSession } from '@/lib/auth-client'
import { getEnv, isTruthy } from '@/lib/env'
import { isBillingEnabled } from '@/lib/environment'
import { createLogger } from '@/lib/logs/console/logger'
import { SSO_TRUSTED_PROVIDERS } from '@/lib/sso/constants'
import { cn } from '@/lib/utils'
import { useOrganizationStore } from '@/stores/organization'
import { useSubscriptionStore } from '@/stores/subscription/store'
import { SettingPageHeader, SettingSection } from '../shared'

const logger = createLogger('SSOSettings')

type ProviderType = 'oidc' | 'saml'

interface SSOProviderView {
  id: string
  providerId: string
  providerType: ProviderType
  issuer: string
  domain: string
  organizationId: string | null
  clientId?: string
  scopes?: string[]
  entryPoint?: string
  audience?: string
}

const REDACTED = '__REDACTED__'

interface FormState {
  providerType: ProviderType
  providerId: string
  issuerUrl: string
  domain: string
  clientId: string
  clientSecret: string
  scopes: string
  entryPoint: string
  cert: string
  audience: string
  wantAssertionsSigned: boolean
  idpMetadata: string
}

const EMPTY_FORM: FormState = {
  providerType: 'oidc',
  providerId: '',
  issuerUrl: '',
  domain: '',
  clientId: '',
  clientSecret: '',
  scopes: 'openid,profile,email',
  entryPoint: '',
  cert: '',
  audience: '',
  wantAssertionsSigned: true,
  idpMetadata: '',
}

function getAppBaseUrl(): string {
  return (
    getEnv('NEXT_PUBLIC_APP_URL') || (typeof window !== 'undefined' ? window.location.origin : '')
  ).replace(/\/$/, '')
}

export function SSO() {
  const { data: session } = useSession()
  const { activeOrganization, loadData, isAdminOrOwner, hasEnterprisePlan } = useOrganizationStore()
  const { getSubscriptionStatus } = useSubscriptionStore()

  const [providers, setProviders] = useState<SSOProviderView[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [isEditing, setIsEditing] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const ssoEnabled = isTruthy(getEnv('NEXT_PUBLIC_SSO_ENABLED'))
  const isSelfHosted = !isBillingEnabled
  const userEmail = session?.user?.email
  const subscription = getSubscriptionStatus()
  const isEnterprise = hasEnterprisePlan || subscription.isEnterprise
  const isOrgAdmin = activeOrganization ? isAdminOrOwner(userEmail || undefined) : false

  // Who can manage SSO: self-hosted deployments always; cloud requires Enterprise + org admin.
  const canManage = isSelfHosted || (isEnterprise && isOrgAdmin)

  const organizationId = activeOrganization?.id

  const fetchProviders = useCallback(async () => {
    setIsLoading(true)
    try {
      const url = organizationId
        ? `/api/auth/sso/providers?organizationId=${encodeURIComponent(organizationId)}`
        : '/api/auth/sso/providers'
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setProviders(data.providers || [])
      }
    } catch (error) {
      logger.error('Failed to load SSO providers', { error })
    } finally {
      setIsLoading(false)
    }
  }, [organizationId])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    if (ssoEnabled) fetchProviders()
    else setIsLoading(false)
  }, [ssoEnabled, fetchProviders])

  const isSaml = form.providerType === 'saml'

  const callbackUrl = useMemo(() => {
    const base = getAppBaseUrl()
    const id = form.providerId || '{provider-id}'
    return isSaml
      ? `${base}/api/auth/sso/saml2/callback/${id}`
      : `${base}/api/auth/sso/callback/${id}`
  }, [form.providerId, isSaml])

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const resetForm = () => {
    setForm(EMPTY_FORM)
    setIsEditing(false)
    setShowForm(false)
    setMessage(null)
  }

  const handleEdit = (provider: SSOProviderView) => {
    setForm({
      ...EMPTY_FORM,
      providerType: provider.providerType,
      providerId: provider.providerId,
      issuerUrl: provider.issuer,
      domain: provider.domain,
      clientId: provider.clientId || '',
      clientSecret: provider.providerType === 'oidc' ? REDACTED : '',
      scopes: provider.scopes?.join(',') || 'openid,profile,email',
      entryPoint: provider.entryPoint || '',
      audience: provider.audience || '',
    })
    setIsEditing(true)
    setShowForm(true)
    setMessage(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    // Client-side required-field checks.
    if (!/^[a-z0-9-]+$/.test(form.providerId)) {
      setMessage({
        type: 'error',
        text: 'Provider ID may only contain lowercase letters, numbers and dashes.',
      })
      return
    }
    if (!form.issuerUrl || !form.domain) {
      setMessage({ type: 'error', text: 'Issuer URL and Domain are required.' })
      return
    }
    if (!isSaml && (!form.clientId || !form.clientSecret)) {
      setMessage({ type: 'error', text: 'Client ID and Client Secret are required for OIDC.' })
      return
    }
    if (isSaml && (!form.entryPoint || !form.cert)) {
      setMessage({ type: 'error', text: 'Entry Point URL and Certificate are required for SAML.' })
      return
    }

    const body: Record<string, unknown> = {
      providerType: form.providerType,
      providerId: form.providerId.trim(),
      issuer: form.issuerUrl.trim(),
      domain: form.domain.trim(),
    }
    if (organizationId) body.organizationId = organizationId

    if (isSaml) {
      body.entryPoint = form.entryPoint.trim()
      body.cert = form.cert.trim()
      body.wantAssertionsSigned = form.wantAssertionsSigned
      if (form.audience.trim()) body.audience = form.audience.trim()
      if (form.idpMetadata.trim()) body.idpMetadata = form.idpMetadata.trim()
    } else {
      body.clientId = form.clientId.trim()
      body.clientSecret = form.clientSecret
      body.scopes = form.scopes
    }

    setIsSaving(true)
    try {
      const res = await fetch('/api/auth/sso/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Failed to save SSO provider.' })
        return
      }
      setMessage({ type: 'success', text: 'SSO provider saved.' })
      resetForm()
      await fetchProviders()
    } catch (error) {
      logger.error('Failed to save SSO provider', { error })
      setMessage({ type: 'error', text: 'Failed to save SSO provider.' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (providerId: string) => {
    try {
      const res = await fetch(
        `/api/auth/sso/providers?providerId=${encodeURIComponent(providerId)}`,
        {
          method: 'DELETE',
        }
      )
      if (res.ok) {
        await fetchProviders()
      } else {
        const data = await res.json().catch(() => ({}))
        setMessage({ type: 'error', text: data.error || 'Failed to delete provider.' })
      }
    } catch (error) {
      logger.error('Failed to delete SSO provider', { error })
    }
  }

  const inputClass = 'h-9'

  return (
    <div className='flex flex-col gap-5'>
      <SettingPageHeader
        title='Single Sign-On'
        description='Let your team sign in through your identity provider using OIDC or SAML 2.0.'
        action={
          canManage && !showForm ? (
            <Button size='sm' onClick={() => setShowForm(true)}>
              <Plus className='mr-1.5 h-4 w-4' />
              Add provider
            </Button>
          ) : undefined
        }
      />

      {!canManage && (
        <Alert>
          <Lock className='h-4 w-4' />
          <AlertTitle>SSO configuration is restricted</AlertTitle>
          <AlertDescription>
            {!isEnterprise
              ? 'Single Sign-On is available on the Enterprise plan.'
              : 'Only organization owners and admins can configure SSO.'}
          </AlertDescription>
        </Alert>
      )}

      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* Existing providers */}
      {canManage && (
        <SettingSection
          title='Configured providers'
          description='Users whose email matches a provider domain are routed to that identity provider.'
          icon={<KeyRound className='h-4 w-4' />}
        >
          {isLoading ? (
            <div className='flex flex-col gap-2'>
              <Skeleton className='h-12 w-full' />
              <Skeleton className='h-12 w-full' />
            </div>
          ) : providers.length === 0 ? (
            <p className='py-2 text-[13px] text-muted-foreground'>
              No SSO providers configured yet.
            </p>
          ) : (
            <div className='flex flex-col divide-y divide-border/60'>
              {providers.map((provider) => (
                <div
                  key={provider.id}
                  className='flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0'
                >
                  <div className='min-w-0'>
                    <div className='flex items-center gap-2'>
                      <span className='truncate font-medium text-[13px] text-foreground'>
                        {provider.providerId}
                      </span>
                      <Badge variant='secondary' className='uppercase'>
                        {provider.providerType}
                      </Badge>
                    </div>
                    <p className='truncate text-[12px] text-muted-foreground'>{provider.domain}</p>
                  </div>
                  <div className='flex shrink-0 items-center gap-1'>
                    <Button variant='ghost' size='sm' onClick={() => handleEdit(provider)}>
                      Edit
                    </Button>
                    <Button
                      variant='ghost'
                      size='icon'
                      className='text-muted-foreground hover:text-destructive'
                      onClick={() => handleDelete(provider.providerId)}
                    >
                      <Trash2 className='h-4 w-4' />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SettingSection>
      )}

      {/* Add / edit form */}
      {canManage && showForm && (
        <SettingSection
          title={isEditing ? 'Edit provider' : 'New provider'}
          description='Register the callback URL below in your identity provider before saving.'
        >
          <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
            <div className='grid gap-4 sm:grid-cols-2'>
              <div className='flex flex-col gap-1.5'>
                <Label htmlFor='sso-type'>Protocol</Label>
                <Select
                  value={form.providerType}
                  onValueChange={(v) => setField('providerType', v as ProviderType)}
                  disabled={isEditing}
                >
                  <SelectTrigger id='sso-type' className={inputClass}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='oidc'>OIDC (OpenID Connect)</SelectItem>
                    <SelectItem value='saml'>SAML 2.0</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className='flex flex-col gap-1.5'>
                <Label htmlFor='sso-provider-id'>Provider ID</Label>
                <Input
                  id='sso-provider-id'
                  list='sso-provider-suggestions'
                  className={inputClass}
                  placeholder='okta'
                  value={form.providerId}
                  disabled={isEditing}
                  onChange={(e) => setField('providerId', e.target.value.toLowerCase())}
                />
                <datalist id='sso-provider-suggestions'>
                  {SSO_TRUSTED_PROVIDERS.map((p) => (
                    <option key={p} value={p} />
                  ))}
                </datalist>
              </div>

              <div className='flex flex-col gap-1.5'>
                <Label htmlFor='sso-issuer'>Issuer URL</Label>
                <Input
                  id='sso-issuer'
                  className={inputClass}
                  placeholder={
                    isSaml ? getAppBaseUrl() : 'https://login.microsoftonline.com/{tenant-id}/v2.0'
                  }
                  value={form.issuerUrl}
                  onChange={(e) => setField('issuerUrl', e.target.value)}
                />
              </div>

              <div className='flex flex-col gap-1.5'>
                <Label htmlFor='sso-domain'>Domain</Label>
                <Input
                  id='sso-domain'
                  className={inputClass}
                  placeholder='company.com'
                  value={form.domain}
                  onChange={(e) => setField('domain', e.target.value)}
                />
              </div>
            </div>

            {/* OIDC fields */}
            {!isSaml && (
              <div className='grid gap-4 sm:grid-cols-2'>
                <div className='flex flex-col gap-1.5'>
                  <Label htmlFor='sso-client-id'>Client ID</Label>
                  <Input
                    id='sso-client-id'
                    className={inputClass}
                    value={form.clientId}
                    onChange={(e) => setField('clientId', e.target.value)}
                  />
                </div>
                <div className='flex flex-col gap-1.5'>
                  <Label htmlFor='sso-client-secret'>Client Secret</Label>
                  <Input
                    id='sso-client-secret'
                    type='password'
                    className={inputClass}
                    placeholder={isEditing ? 'Leave unchanged to keep current secret' : ''}
                    value={form.clientSecret === REDACTED ? '' : form.clientSecret}
                    onChange={(e) => setField('clientSecret', e.target.value)}
                  />
                </div>
                <div className='flex flex-col gap-1.5 sm:col-span-2'>
                  <Label htmlFor='sso-scopes'>Scopes</Label>
                  <Input
                    id='sso-scopes'
                    className={inputClass}
                    value={form.scopes}
                    onChange={(e) => setField('scopes', e.target.value)}
                  />
                  <p className='text-[12px] text-muted-foreground'>
                    Comma-separated. Endpoints are auto-discovered from the issuer.
                  </p>
                </div>
              </div>
            )}

            {/* SAML fields */}
            {isSaml && (
              <div className='flex flex-col gap-4'>
                <div className='flex flex-col gap-1.5'>
                  <Label htmlFor='sso-entrypoint'>Entry Point URL</Label>
                  <Input
                    id='sso-entrypoint'
                    className={inputClass}
                    placeholder='https://adfs.company.com/adfs/ls'
                    value={form.entryPoint}
                    onChange={(e) => setField('entryPoint', e.target.value)}
                  />
                </div>
                <div className='flex flex-col gap-1.5'>
                  <Label htmlFor='sso-cert'>Identity Provider Certificate</Label>
                  <Textarea
                    id='sso-cert'
                    rows={5}
                    className='font-mono text-[12px]'
                    placeholder='-----BEGIN CERTIFICATE-----'
                    value={form.cert}
                    onChange={(e) => setField('cert', e.target.value)}
                  />
                </div>
                <div className='flex items-center justify-between rounded-lg border border-border/60 px-3 py-2.5'>
                  <div>
                    <Label htmlFor='sso-signed' className='text-[13px]'>
                      Require signed assertions
                    </Label>
                    <p className='text-[12px] text-muted-foreground'>
                      Verify the IdP signature on SAML assertions.
                    </p>
                  </div>
                  <Switch
                    id='sso-signed'
                    checked={form.wantAssertionsSigned}
                    onCheckedChange={(v) => setField('wantAssertionsSigned', v)}
                  />
                </div>
                <div className='flex flex-col gap-1.5'>
                  <Label htmlFor='sso-audience'>Audience / Entity ID (optional)</Label>
                  <Input
                    id='sso-audience'
                    className={inputClass}
                    value={form.audience}
                    onChange={(e) => setField('audience', e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Callback URL */}
            <div className='flex flex-col gap-1.5'>
              <Label>Callback URL</Label>
              <div className='flex items-center gap-2 rounded-lg border border-border/60 bg-muted/40 px-3 py-2'>
                <code className='min-w-0 flex-1 truncate text-[12px] text-muted-foreground'>
                  {callbackUrl}
                </code>
                <CopyButton text={callbackUrl} showLabel={false} />
              </div>
              <p className='text-[12px] text-muted-foreground'>
                Register this URL in your identity provider before saving.
              </p>
            </div>

            <div className={cn('flex items-center gap-2 pt-1')}>
              <Button type='submit' disabled={isSaving}>
                {isSaving && <Loader2 className='mr-1.5 h-4 w-4 animate-spin' />}
                {isEditing ? 'Save changes' : 'Save provider'}
              </Button>
              <Button type='button' variant='ghost' onClick={resetForm} disabled={isSaving}>
                Cancel
              </Button>
            </div>
          </form>
        </SettingSection>
      )}
    </div>
  )
}
