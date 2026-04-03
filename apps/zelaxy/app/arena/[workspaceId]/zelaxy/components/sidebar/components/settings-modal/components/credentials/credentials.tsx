'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, ExternalLink, RefreshCw, Search } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { client, useSession } from '@/lib/auth-client'
import { createLogger } from '@/lib/logs/console/logger'
import { OAUTH_PROVIDERS, type OAuthServiceConfig } from '@/lib/oauth/oauth'
import { cn } from '@/lib/utils'

const logger = createLogger('Credentials')

interface CredentialsProps {
  onOpenChange?: (open: boolean) => void
}

interface ServiceInfo extends OAuthServiceConfig {
  isConnected: boolean
  lastConnected?: string
  accounts?: { id: string; name: string }[]
}

export function Credentials({ onOpenChange }: CredentialsProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const userId = session?.user?.id
  const pendingServiceRef = useRef<HTMLDivElement>(null)

  const [services, setServices] = useState<ServiceInfo[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isConnecting, setIsConnecting] = useState<string | null>(null)
  const [pendingService, setPendingService] = useState<string | null>(null)
  const [_pendingScopes, setPendingScopes] = useState<string[]>([])
  const [authSuccess, setAuthSuccess] = useState(false)
  const [showActionRequired, setShowActionRequired] = useState(false)

  // Define available services from our standardized OAuth providers
  const defineServices = (): ServiceInfo[] => {
    const servicesList: ServiceInfo[] = []

    // Convert our standardized providers to ServiceInfo objects
    Object.values(OAUTH_PROVIDERS).forEach((provider) => {
      Object.values(provider.services).forEach((service) => {
        servicesList.push({
          ...service,
          isConnected: false,
          scopes: service.scopes || [],
        })
      })
    })

    return servicesList
  }

  // Fetch services and their connection status
  const fetchServices = async () => {
    if (!userId) return

    setIsLoading(true)
    try {
      // Start with the base service definitions
      const serviceDefinitions = defineServices()

      // Fetch all OAuth connections for the user
      const response = await fetch('/api/auth/oauth/connections')
      if (response.ok) {
        const data = await response.json()
        const connections = data.connections || []

        // Update services with connection status and account info
        const updatedServices = serviceDefinitions.map((service) => {
          // Find matching connection - now we can do an exact match on providerId
          const connection = connections.find((conn: any) => {
            // Exact match on providerId is the most reliable
            return conn.provider === service.providerId
          })

          // If we found an exact match, use it
          if (connection) {
            return {
              ...service,
              isConnected: connection.accounts?.length > 0,
              accounts: connection.accounts || [],
              lastConnected: connection.lastConnected,
            }
          }

          // If no exact match, check if any connection has all the required scopes
          const connectionWithScopes = connections.find((conn: any) => {
            // Only consider connections from the same base provider
            if (!conn.baseProvider || !service.providerId.startsWith(conn.baseProvider)) {
              return false
            }

            // Check if all required scopes for this service are included in the connection
            if (conn.scopes && service.scopes) {
              return service.scopes.every((scope) => conn.scopes.includes(scope))
            }

            return false
          })

          if (connectionWithScopes) {
            return {
              ...service,
              isConnected: connectionWithScopes.accounts?.length > 0,
              accounts: connectionWithScopes.accounts || [],
              lastConnected: connectionWithScopes.lastConnected,
            }
          }

          return service
        })

        setServices(updatedServices)
      } else {
        // If there's an error, just use the base definitions
        setServices(serviceDefinitions)
      }
    } catch (error) {
      logger.error('Error fetching services:', { error })
      // Use base definitions on error
      setServices(defineServices())
    } finally {
      setIsLoading(false)
    }
  }

  // Check for OAuth callback
  useEffect(() => {
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    // Handle OAuth callback
    if (code && state) {
      // This is an OAuth callback - try to restore state from localStorage
      try {
        const stored = localStorage.getItem('pending_oauth_state')
        if (stored) {
          const oauthState = JSON.parse(stored)
          logger.info('OAuth callback with restored state:', oauthState)

          // Mark as pending if we have context about what service was being connected
          if (oauthState.serviceId) {
            setPendingService(oauthState.serviceId)
            setShowActionRequired(true)
          }

          // Clean up the state (one-time use)
          localStorage.removeItem('pending_oauth_state')
        } else {
          logger.warn('OAuth callback but no state found in localStorage')
        }
      } catch (error) {
        logger.error('Error loading OAuth state from localStorage:', error)
        localStorage.removeItem('pending_oauth_state') // Clean up corrupted state
      }

      // Set success flag
      setAuthSuccess(true)

      // Refresh connections to show the new connection
      if (userId) {
        fetchServices()
      }

      // Clear the URL parameters
      router.replace('/arena')
    } else if (error) {
      logger.error('OAuth error:', { error })
      router.replace('/arena')
    }
  }, [searchParams, router, userId])

  // Fetch services on mount
  useEffect(() => {
    if (userId) {
      fetchServices()
    }
  }, [userId])

  // Handle connect button click
  const handleConnect = async (service: ServiceInfo) => {
    try {
      setIsConnecting(service.id)

      logger.info('Connecting service:', {
        serviceId: service.id,
        providerId: service.providerId,
        scopes: service.scopes,
      })

      await client.oauth2.link({
        providerId: service.providerId,
        callbackURL: window.location.href,
      })
    } catch (error) {
      logger.error('OAuth connection error:', { error })
      setIsConnecting(null)
    }
  }

  // Handle disconnect button click
  const handleDisconnect = async (service: ServiceInfo, accountId: string) => {
    setIsConnecting(`${service.id}-${accountId}`)
    try {
      // Call the API to disconnect the account
      const response = await fetch('/api/auth/oauth/disconnect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: service.providerId.split('-')[0],
          providerId: service.providerId,
        }),
      })

      if (response.ok) {
        // Update the local state by removing the disconnected account
        setServices((prev) =>
          prev.map((svc) => {
            if (svc.id === service.id) {
              return {
                ...svc,
                accounts: svc.accounts?.filter((acc) => acc.id !== accountId) || [],
                isConnected: (svc.accounts?.length || 0) > 1,
              }
            }
            return svc
          })
        )
      } else {
        logger.error('Error disconnecting service')
      }
    } catch (error) {
      logger.error('Error disconnecting service:', { error })
    } finally {
      setIsConnecting(null)
    }
  }

  // Group services by provider
  const groupedServices = services.reduce(
    (acc, service) => {
      // Find the provider for this service
      const providerKey =
        Object.keys(OAUTH_PROVIDERS).find((key) =>
          Object.keys(OAUTH_PROVIDERS[key].services).includes(service.id)
        ) || 'other'

      if (!acc[providerKey]) {
        acc[providerKey] = []
      }

      acc[providerKey].push(service)
      return acc
    },
    {} as Record<string, ServiceInfo[]>
  )

  // Filter services based on search term
  const filteredGroupedServices = Object.entries(groupedServices).reduce(
    (acc, [providerKey, providerServices]) => {
      const filteredServices = providerServices.filter(
        (service) =>
          service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          service.description.toLowerCase().includes(searchTerm.toLowerCase())
      )

      if (filteredServices.length > 0) {
        acc[providerKey] = filteredServices
      }

      return acc
    },
    {} as Record<string, ServiceInfo[]>
  )

  const scrollToHighlightedService = () => {
    if (pendingServiceRef.current) {
      pendingServiceRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    }
  }

  return (
    <div className='space-y-6 px-3 py-6'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4'>
        <div className='min-w-0'>
          <h2 className='font-semibold text-foreground text-lg tracking-tight'>Credentials</h2>
          <p className='mt-1 text-[13px] text-muted-foreground leading-relaxed'>
            Connect your accounts to use tools that require authentication.
          </p>
        </div>
        {/* Search */}
        <div className='relative shrink-0'>
          <Search className='-translate-y-1/2 absolute top-1/2 left-2.5 h-3.5 w-3.5 text-muted-foreground' />
          <Input
            placeholder='Search services…'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className='h-8 w-full rounded-lg pl-8 text-[13px] sm:w-44'
          />
        </div>
      </div>

      {/* Success message */}
      {authSuccess && (
        <div className='flex items-center gap-3 rounded-xl border border-emerald-200/60 bg-emerald-50/50 p-3 dark:border-emerald-800/40 dark:bg-emerald-950/30'>
          <span className='flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/60'>
            <Check className='h-3 w-3 text-emerald-600 dark:text-emerald-400' />
          </span>
          <p className='font-medium text-[13px] text-emerald-800 dark:text-emerald-200'>
            Account connected successfully!
          </p>
        </div>
      )}

      {/* Pending service — action required banner */}
      {pendingService && showActionRequired && (
        <div className='flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4'>
          <ExternalLink className='mt-0.5 h-4 w-4 shrink-0 text-primary' />
          <div>
            <p className='text-[13px] text-muted-foreground'>
              <span className='font-medium text-primary'>Action Required:</span> Please connect your
              account to enable the requested features.
            </p>
            <Button
              variant='outline'
              size='sm'
              onClick={scrollToHighlightedService}
              className='mt-2 h-7 gap-1 rounded-lg border-primary/20 px-2.5 text-[12px] text-primary hover:bg-primary/10'
            >
              Go to service <ChevronDown className='h-3 w-3' />
            </Button>
          </div>
        </div>
      )}

      {/* Loading state */}
      {isLoading ? (
        <div className='space-y-3'>
          <ConnectionSkeleton />
          <ConnectionSkeleton />
          <ConnectionSkeleton />
        </div>
      ) : (
        <div className='space-y-6'>
          {Object.entries(filteredGroupedServices).map(([providerKey, providerServices]) => (
            <div key={providerKey}>
              <span className='mb-2 block font-medium text-[11px] text-muted-foreground/70 uppercase tracking-wider'>
                {OAUTH_PROVIDERS[providerKey]?.name || 'Other Services'}
              </span>
              <div className='space-y-2'>
                {providerServices.map((service) => (
                  <div
                    key={service.id}
                    ref={pendingService === service.id ? pendingServiceRef : undefined}
                    className={cn(
                      'rounded-xl border border-border/60 bg-card/50 p-3 transition-colors sm:p-4',
                      pendingService === service.id && 'border-primary/40 bg-primary/5'
                    )}
                  >
                    <div className='flex items-start gap-2.5 sm:gap-3.5'>
                      <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/70 sm:h-9 sm:w-9'>
                        {typeof service.icon === 'function'
                          ? service.icon({ className: 'h-4 w-4' })
                          : service.icon}
                      </div>
                      <div className='min-w-0 flex-1'>
                        <div className='flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3'>
                          <div className='min-w-0'>
                            <p className='font-medium text-[13px] text-foreground'>
                              {service.name}
                            </p>
                            <p className='mt-0.5 text-[12px] text-muted-foreground'>
                              {service.description}
                            </p>
                          </div>
                          {!service.accounts?.length && (
                            <Button
                              size='sm'
                              className='h-7 shrink-0 rounded-lg text-[12px]'
                              onClick={() => handleConnect(service)}
                              disabled={isConnecting === service.id}
                            >
                              {isConnecting === service.id ? (
                                <>
                                  <RefreshCw className='mr-1.5 h-3 w-3 animate-spin' />
                                  Connecting…
                                </>
                              ) : (
                                'Connect'
                              )}
                            </Button>
                          )}
                        </div>

                        {/* Connected accounts */}
                        {service.accounts && service.accounts.length > 0 && (
                          <div className='mt-3 space-y-1.5'>
                            {service.accounts.map((account) => (
                              <div
                                key={account.id}
                                className='flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/40 bg-background px-2 py-1.5 sm:px-3 sm:py-2'
                              >
                                <div className='flex items-center gap-2'>
                                  <span className='flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/60'>
                                    <Check className='h-2.5 w-2.5 text-emerald-600 dark:text-emerald-400' />
                                  </span>
                                  <span className='font-medium text-[12px]'>{account.name}</span>
                                </div>
                                <Button
                                  variant='ghost'
                                  size='sm'
                                  className='h-6 rounded-md px-2 text-[11px] text-muted-foreground hover:text-destructive'
                                  onClick={() => handleDisconnect(service, account.id)}
                                  disabled={isConnecting === `${service.id}-${account.id}`}
                                >
                                  {isConnecting === `${service.id}-${account.id}` ? (
                                    <RefreshCw className='h-3 w-3 animate-spin' />
                                  ) : (
                                    'Disconnect'
                                  )}
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Empty search */}
          {searchTerm.trim() && Object.keys(filteredGroupedServices).length === 0 && (
            <div className='py-10 text-center text-[13px] text-muted-foreground'>
              No services matching "{searchTerm}"
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Skeleton ─────────────────────────────────────────────────────────────────

function ConnectionSkeleton() {
  return (
    <div className='flex items-start gap-3.5 rounded-xl border border-border/40 p-4'>
      <Skeleton className='h-9 w-9 rounded-lg' />
      <div className='flex-1 space-y-2'>
        <Skeleton className='h-4 w-28 rounded-md' />
        <Skeleton className='h-3 w-44 rounded-md' />
      </div>
      <Skeleton className='h-7 w-20 rounded-lg' />
    </div>
  )
}
