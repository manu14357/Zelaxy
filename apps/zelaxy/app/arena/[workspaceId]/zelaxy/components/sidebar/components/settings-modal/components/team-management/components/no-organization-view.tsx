import { Building2, RefreshCw } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { isBillingEnabled } from '@/lib/environment'
import { OrganizationCreationDialog } from './'

interface NoOrganizationViewProps {
  hasTeamPlan: boolean
  hasEnterprisePlan: boolean
  orgName: string
  setOrgName: (name: string) => void
  orgSlug: string
  setOrgSlug: (slug: string) => void
  onOrgNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onCreateOrganization: () => Promise<void>
  isCreatingOrg: boolean
  error: string | null
  createOrgDialogOpen: boolean
  setCreateOrgDialogOpen: (open: boolean) => void
}

export function NoOrganizationView({
  hasTeamPlan,
  hasEnterprisePlan,
  orgName,
  setOrgName,
  orgSlug,
  setOrgSlug,
  onOrgNameChange,
  onCreateOrganization,
  isCreatingOrg,
  error,
  createOrgDialogOpen,
  setCreateOrgDialogOpen,
}: NoOrganizationViewProps) {
  // Show creation form when user has a team/enterprise plan OR when billing is disabled
  const canCreateOrg = hasTeamPlan || hasEnterprisePlan || !isBillingEnabled

  if (canCreateOrg) {
    return (
      <div className='space-y-4 px-3 py-4 sm:px-5 sm:py-6'>
        <div className='rounded-xl border border-border/60 bg-card/50'>
          <div className='px-3 pt-3 pb-1 sm:px-4 sm:pt-4'>
            <h3 className='font-semibold text-[13px] text-foreground tracking-tight'>
              Create Your Team Workspace
            </h3>
          </div>
          <div className='space-y-4 px-3 pt-3 pb-3 sm:px-4 sm:pb-4'>
            <p className='text-[12px] text-muted-foreground leading-relaxed'>
              {hasEnterprisePlan
                ? "You're subscribed to an enterprise plan. Create your workspace to start collaborating with your team."
                : hasTeamPlan
                  ? "You're subscribed to a team plan. Create your workspace to start collaborating with your team."
                  : 'Create a team workspace to start collaborating with others. You can invite members and manage permissions.'}
            </p>

            <div className='space-y-3'>
              <div className='space-y-1.5'>
                <label htmlFor='orgName' className='font-medium text-[12px] text-foreground'>
                  Team Name
                </label>
                <Input
                  id='orgName'
                  value={orgName}
                  onChange={onOrgNameChange}
                  placeholder='My Team'
                  className='h-9 rounded-lg text-[13px]'
                />
              </div>

              <div className='space-y-1.5'>
                <label htmlFor='orgSlug' className='font-medium text-[12px] text-foreground'>
                  Team Slug
                </label>
                <Input
                  id='orgSlug'
                  value={orgSlug}
                  onChange={(e) => setOrgSlug(e.target.value)}
                  placeholder='my-team'
                  className='h-9 rounded-lg text-[13px]'
                />
              </div>
            </div>

            {error && (
              <Alert variant='destructive' className='rounded-lg border-destructive/40'>
                <AlertTitle className='text-[13px]'>Error</AlertTitle>
                <AlertDescription className='text-[12px]'>{error}</AlertDescription>
              </Alert>
            )}

            <div className='flex justify-end'>
              <Button
                onClick={onCreateOrganization}
                disabled={!orgName || !orgSlug || isCreatingOrg}
                size='sm'
                className='h-8 rounded-lg text-[13px]'
              >
                {isCreatingOrg && <RefreshCw className='mr-1.5 h-3.5 w-3.5 animate-spin' />}
                Create Team Workspace
              </Button>
            </div>
          </div>
        </div>

        <OrganizationCreationDialog
          open={createOrgDialogOpen}
          onOpenChange={setCreateOrgDialogOpen}
          orgName={orgName}
          onOrgNameChange={onOrgNameChange}
          orgSlug={orgSlug}
          onOrgSlugChange={setOrgSlug}
          onCreateOrganization={onCreateOrganization}
          isCreating={isCreatingOrg}
          error={error}
        />
      </div>
    )
  }

  return (
    <div className='px-3 py-4 sm:px-5 sm:py-6'>
      <div className='rounded-xl border border-border/60 bg-card/50'>
        <div className='space-y-4 px-3 py-6 text-center sm:px-4 sm:py-8'>
          <div className='mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-muted/70'>
            <Building2 className='h-5 w-5 text-muted-foreground' />
          </div>
          <div className='space-y-1'>
            <h3 className='font-semibold text-[13px] text-foreground'>No Team Workspace</h3>
            <p className='text-[12px] text-muted-foreground'>
              You don&apos;t have a team workspace yet. To collaborate with others, first upgrade to
              a team or enterprise plan.
            </p>
          </div>
          <Button
            size='sm'
            onClick={() => {
              const event = new CustomEvent('open-settings', {
                detail: { tab: 'subscription' },
              })
              window.dispatchEvent(event)
            }}
            className='h-8 rounded-lg text-[13px]'
          >
            Upgrade to Team Plan
          </Button>
        </div>
      </div>
    </div>
  )
}
