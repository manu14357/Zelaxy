import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Organization, OrganizationFormData } from '@/stores/organization'

interface OrganizationSettingsTabProps {
  organization: Organization
  isAdminOrOwner: boolean
  userRole: string
  orgFormData: OrganizationFormData
  onOrgInputChange: (field: string, value: string) => void
  onSaveOrgSettings: () => Promise<void>
  isSavingOrgSettings: boolean
  orgSettingsError: string | null
  orgSettingsSuccess: string | null
}

export function OrganizationSettingsTab({
  organization,
  isAdminOrOwner,
  userRole,
  orgFormData,
  onOrgInputChange,
  onSaveOrgSettings,
  isSavingOrgSettings,
  orgSettingsError,
  orgSettingsSuccess,
}: OrganizationSettingsTabProps) {
  return (
    <div className='mt-4 space-y-4'>
      {orgSettingsError && (
        <Alert variant='destructive' className='rounded-lg border-destructive/40'>
          <AlertTitle className='text-[13px]'>Error</AlertTitle>
          <AlertDescription className='text-[12px]'>{orgSettingsError}</AlertDescription>
        </Alert>
      )}

      {orgSettingsSuccess && (
        <Alert className='rounded-lg border-emerald-200/60 bg-emerald-50/50 dark:border-emerald-800/40 dark:bg-emerald-950/30'>
          <AlertTitle className='text-[13px]'>Success</AlertTitle>
          <AlertDescription className='text-[12px]'>{orgSettingsSuccess}</AlertDescription>
        </Alert>
      )}

      {!isAdminOrOwner && (
        <Alert className='rounded-lg border-amber-200/60 bg-amber-50/50 dark:border-amber-800/40 dark:bg-amber-950/30'>
          <AlertTitle className='text-[13px]'>Read Only</AlertTitle>
          <AlertDescription className='text-[12px]'>
            You need owner or admin permissions to modify team settings.
          </AlertDescription>
        </Alert>
      )}

      <div className='rounded-xl border border-border/60 bg-card/50'>
        <div className='px-3 pt-3 pb-1 sm:px-4 sm:pt-4'>
          <h3 className='font-semibold text-[13px] text-foreground tracking-tight'>
            Basic Information
          </h3>
          <p className='mt-0.5 text-[12px] text-muted-foreground leading-snug'>
            Update your team&apos;s basic information and branding
          </p>
        </div>
        <div className='space-y-4 px-3 pt-3 pb-3 sm:px-4 sm:pb-4'>
          <div className='space-y-1.5'>
            <Label htmlFor='team-name' className='font-medium text-[12px]'>
              Team Name
            </Label>
            <Input
              id='team-name'
              value={orgFormData.name}
              onChange={(e) => onOrgInputChange('name', e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && isAdminOrOwner && !isSavingOrgSettings) {
                  onSaveOrgSettings()
                }
              }}
              placeholder='Enter team name'
              disabled={!isAdminOrOwner || isSavingOrgSettings}
              className='h-9 rounded-lg text-[13px]'
            />
          </div>

          <div className='space-y-1.5'>
            <Label htmlFor='team-slug' className='font-medium text-[12px]'>
              Team Slug
            </Label>
            <Input
              id='team-slug'
              value={orgFormData.slug}
              onChange={(e) => onOrgInputChange('slug', e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && isAdminOrOwner && !isSavingOrgSettings) {
                  onSaveOrgSettings()
                }
              }}
              placeholder='team-slug'
              disabled={!isAdminOrOwner || isSavingOrgSettings}
              className='h-9 rounded-lg text-[13px]'
            />
            <p className='text-[11px] text-muted-foreground'>
              Used in URLs and API references. Can only contain lowercase letters, numbers, hyphens,
              and underscores.
            </p>
          </div>

          <div className='space-y-1.5'>
            <Label htmlFor='team-logo' className='font-medium text-[12px]'>
              Logo URL (Optional)
            </Label>
            <Input
              id='team-logo'
              value={orgFormData.logo}
              onChange={(e) => onOrgInputChange('logo', e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && isAdminOrOwner && !isSavingOrgSettings) {
                  onSaveOrgSettings()
                }
              }}
              placeholder='https://example.com/logo.png'
              disabled={!isAdminOrOwner || isSavingOrgSettings}
              className='h-9 rounded-lg text-[13px]'
            />
          </div>
        </div>
      </div>

      <div className='rounded-xl border border-border/60 bg-card/50'>
        <div className='px-3 pt-3 pb-1 sm:px-4 sm:pt-4'>
          <h3 className='font-semibold text-[13px] text-foreground tracking-tight'>
            Team Information
          </h3>
        </div>
        <div className='divide-y divide-border/40 px-3 pt-3 pb-3 sm:px-4 sm:pb-4'>
          <div className='flex justify-between py-2.5 first:pt-0 last:pb-0'>
            <span className='text-[12px] text-muted-foreground'>Team ID</span>
            <span className='font-mono text-[12px] text-foreground'>{organization.id}</span>
          </div>
          <div className='flex justify-between py-2.5 first:pt-0 last:pb-0'>
            <span className='text-[12px] text-muted-foreground'>Created</span>
            <span className='text-[12px] text-foreground'>
              {new Date(organization.createdAt).toLocaleDateString()}
            </span>
          </div>
          <div className='flex justify-between py-2.5 first:pt-0 last:pb-0'>
            <span className='text-[12px] text-muted-foreground'>Your Role</span>
            <span className='font-medium text-[12px] text-foreground capitalize'>{userRole}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
