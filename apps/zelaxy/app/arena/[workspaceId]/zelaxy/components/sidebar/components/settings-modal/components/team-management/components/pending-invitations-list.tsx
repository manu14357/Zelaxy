import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Invitation, Organization } from '@/stores/organization'

interface PendingInvitationsListProps {
  organization: Organization
  onCancelInvitation: (invitationId: string) => void
}

export function PendingInvitationsList({
  organization,
  onCancelInvitation,
}: PendingInvitationsListProps) {
  const pendingInvitations = organization.invitations?.filter(
    (invitation) => invitation.status === 'pending'
  )

  if (!pendingInvitations || pendingInvitations.length === 0) {
    return null
  }

  return (
    <div className='rounded-xl border border-border/60 bg-card/50'>
      <h4 className='border-border/40 border-b px-3 py-3 font-semibold text-[13px] text-foreground sm:px-4'>
        Pending Invitations
      </h4>
      <div className='divide-y divide-border/40'>
        {pendingInvitations.map((invitation: Invitation) => (
          <div
            key={invitation.id}
            className='flex items-center justify-between px-3 py-2.5 sm:px-4 sm:py-3'
          >
            <div className='flex-1'>
              <div className='flex items-center gap-3'>
                <div className='flex h-7 w-7 items-center justify-center rounded-full bg-muted/70 font-semibold text-[12px] text-muted-foreground'>
                  {invitation.email.charAt(0).toUpperCase()}
                </div>
                <div className='min-w-0 flex-1'>
                  <div className='font-medium text-[13px] text-foreground'>{invitation.email}</div>
                  <div className='text-[12px] text-muted-foreground'>Invitation pending</div>
                </div>
              </div>
            </div>

            <Button
              variant='ghost'
              size='sm'
              onClick={() => onCancelInvitation(invitation.id)}
              className='h-7 w-7 rounded-lg p-0 text-muted-foreground hover:text-destructive'
            >
              <X className='h-3.5 w-3.5' />
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
