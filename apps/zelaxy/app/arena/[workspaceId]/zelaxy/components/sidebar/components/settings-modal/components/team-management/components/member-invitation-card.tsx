import React, { useMemo } from 'react'
import { CheckCircle, ChevronDown, Mail, PlusCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

type PermissionType = 'read' | 'write' | 'admin'

interface PermissionSelectorProps {
  value: PermissionType
  onChange: (value: PermissionType) => void
  disabled?: boolean
  className?: string
}

const PermissionSelector = React.memo<PermissionSelectorProps>(
  ({ value, onChange, disabled = false, className = '' }) => {
    const permissionOptions = useMemo(
      () => [
        { value: 'read' as PermissionType, label: 'Read', description: 'View only' },
        { value: 'write' as PermissionType, label: 'Write', description: 'Edit content' },
        { value: 'admin' as PermissionType, label: 'Admin', description: 'Full access' },
      ],
      []
    )

    return (
      <div
        className={cn(
          'inline-flex overflow-hidden rounded-lg border border-border/60 bg-muted/40',
          className
        )}
      >
        {permissionOptions.map((option, index) => (
          <button
            key={option.value}
            type='button'
            onClick={() => !disabled && onChange(option.value)}
            disabled={disabled}
            title={option.description}
            className={cn(
              'relative px-2.5 py-1 font-medium text-[11px] transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
              disabled && 'cursor-not-allowed opacity-50',
              value === option.value
                ? 'z-10 bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:z-20 hover:bg-muted/50 hover:text-foreground',
              index > 0 && 'border-border/60 border-l'
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    )
  }
)

PermissionSelector.displayName = 'PermissionSelector'

interface MemberInvitationCardProps {
  inviteEmail: string
  setInviteEmail: (email: string) => void
  isInviting: boolean
  showWorkspaceInvite: boolean
  setShowWorkspaceInvite: (show: boolean) => void
  selectedWorkspaces: Array<{ workspaceId: string; permission: string }>
  userWorkspaces: any[]
  onInviteMember: () => Promise<void>
  onLoadUserWorkspaces: () => Promise<void>
  onWorkspaceToggle: (workspaceId: string, permission: string) => void
  inviteSuccess: boolean
}

function ButtonSkeleton() {
  return (
    <div className='h-4 w-4 animate-spin rounded-full border-2 border-muted border-t-primary' />
  )
}

export function MemberInvitationCard({
  inviteEmail,
  setInviteEmail,
  isInviting,
  showWorkspaceInvite,
  setShowWorkspaceInvite,
  selectedWorkspaces,
  userWorkspaces,
  onInviteMember,
  onLoadUserWorkspaces,
  onWorkspaceToggle,
  inviteSuccess,
}: MemberInvitationCardProps) {
  const selectedCount = selectedWorkspaces.length

  return (
    <div className='rounded-xl border border-border/60 bg-card/50'>
      <div className='px-4 pt-4 pb-1'>
        <div className='flex items-center gap-2.5'>
          <span className='flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/70 text-muted-foreground'>
            <Mail className='h-4 w-4' />
          </span>
          <div className='min-w-0'>
            <h3 className='font-semibold text-[13px] text-foreground tracking-tight'>
              Invite Team Members
            </h3>
            <p className='mt-0.5 text-[12px] text-muted-foreground leading-snug'>
              Add members and optionally grant workspace access.
            </p>
          </div>
        </div>
      </div>
      <div className='space-y-4 px-4 pt-3 pb-4'>
        <div className='flex items-center gap-2'>
          <div className='flex-1'>
            <Input
              placeholder='Enter email address'
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              disabled={isInviting}
              className='h-9 w-full rounded-lg text-[13px]'
            />
          </div>
          <Button
            variant='outline'
            size='sm'
            onClick={() => {
              setShowWorkspaceInvite(!showWorkspaceInvite)
              if (!showWorkspaceInvite) {
                onLoadUserWorkspaces()
              }
            }}
            disabled={isInviting}
            className='h-8 shrink-0 gap-1 rounded-lg text-[12px]'
          >
            {showWorkspaceInvite ? 'Hide' : 'Add'} Workspaces
            {selectedCount > 0 && (
              <Badge variant='secondary' className='ml-1 h-4 rounded-md px-1.5 text-[10px]'>
                {selectedCount}
              </Badge>
            )}
            <ChevronDown
              className={cn(
                'h-3.5 w-3.5 transition-transform',
                showWorkspaceInvite && 'rotate-180'
              )}
            />
          </Button>
          <Button
            size='sm'
            onClick={onInviteMember}
            disabled={!inviteEmail || isInviting}
            className='h-8 shrink-0 gap-1.5 rounded-lg text-[12px]'
          >
            {isInviting ? <ButtonSkeleton /> : <PlusCircle className='h-3.5 w-3.5' />}
            Invite
          </Button>
        </div>

        {showWorkspaceInvite && (
          <div className='space-y-3 pt-1'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <h5 className='font-semibold text-[12px] text-foreground'>Workspace Access</h5>
                <Badge variant='outline' className='rounded-md text-[10px]'>
                  Optional
                </Badge>
              </div>
              {selectedCount > 0 && (
                <span className='text-[11px] text-muted-foreground'>{selectedCount} selected</span>
              )}
            </div>
            <p className='text-[12px] text-muted-foreground leading-relaxed'>
              Grant access to specific workspaces. You can modify permissions later.
            </p>

            {userWorkspaces.length === 0 ? (
              <div className='rounded-lg border border-border/60 border-dashed py-6 text-center'>
                <p className='text-[13px] text-muted-foreground'>No workspaces available</p>
                <p className='mt-1 text-[12px] text-muted-foreground'>
                  You need admin access to workspaces to invite members
                </p>
              </div>
            ) : (
              <div className='max-h-48 space-y-1.5 overflow-y-auto rounded-lg border border-border/60 bg-muted/20 p-2'>
                {userWorkspaces.map((workspace) => {
                  const isSelected = selectedWorkspaces.some((w) => w.workspaceId === workspace.id)
                  const selectedWorkspace = selectedWorkspaces.find(
                    (w) => w.workspaceId === workspace.id
                  )

                  return (
                    <div
                      key={workspace.id}
                      className={cn(
                        'flex items-center justify-between rounded-lg border bg-background p-2.5 transition-all',
                        isSelected
                          ? 'border-primary/20 bg-primary/5'
                          : 'border-border/40 hover:border-border hover:bg-muted/50'
                      )}
                    >
                      <div className='flex items-center gap-3'>
                        <Checkbox
                          id={`workspace-${workspace.id}`}
                          checked={isSelected}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              onWorkspaceToggle(workspace.id, 'read')
                            } else {
                              onWorkspaceToggle(workspace.id, '')
                            }
                          }}
                          disabled={isInviting}
                        />
                        <Label
                          htmlFor={`workspace-${workspace.id}`}
                          className='cursor-pointer font-medium text-[13px] leading-none'
                        >
                          {workspace.name}
                        </Label>
                        {workspace.isOwner && (
                          <Badge variant='outline' className='rounded-md text-[10px]'>
                            Owner
                          </Badge>
                        )}
                      </div>

                      {isSelected && (
                        <div className='flex items-center gap-2'>
                          <PermissionSelector
                            value={
                              (['read', 'write', 'admin'].includes(
                                selectedWorkspace?.permission ?? ''
                              )
                                ? selectedWorkspace?.permission
                                : 'read') as PermissionType
                            }
                            onChange={(permission) => onWorkspaceToggle(workspace.id, permission)}
                            disabled={isInviting}
                            className='h-8'
                          />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {inviteSuccess && (
          <Alert className='rounded-lg border-emerald-200/60 bg-emerald-50/50 text-emerald-800 dark:border-emerald-800/40 dark:bg-emerald-950/20 dark:text-emerald-300'>
            <CheckCircle className='h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400' />
            <AlertDescription className='text-[13px]'>
              Invitation sent successfully
              {selectedCount > 0 &&
                ` with access to ${selectedCount} workspace${selectedCount !== 1 ? 's' : ''}`}
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  )
}
