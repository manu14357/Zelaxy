'use client'

import { useState } from 'react'
import { Shield, ShieldCheck, UserX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Member, Organization } from '@/stores/organization'

interface TeamMembersListProps {
  organization: Organization
  currentUserEmail: string
  isAdminOrOwner: boolean
  isOwner: boolean
  onRemoveMember: (member: Member) => void
  onUpdateRole?: (memberId: string, newRole: string) => Promise<void>
}

export function TeamMembersList({
  organization,
  currentUserEmail,
  isAdminOrOwner,
  isOwner,
  onRemoveMember,
  onUpdateRole,
}: TeamMembersListProps) {
  const [updatingRoleFor, setUpdatingRoleFor] = useState<string | null>(null)

  if (!organization.members || organization.members.length === 0) {
    return (
      <div className='rounded-xl border border-border/60 bg-card/50'>
        <h4 className='border-border/40 border-b px-4 py-3 font-semibold text-[13px] text-foreground'>
          Team Members
        </h4>
        <div className='px-4 py-6 text-center text-[13px] text-muted-foreground'>
          No members in this organization yet.
        </div>
      </div>
    )
  }

  const handleRoleChange = async (memberId: string, newRole: string) => {
    if (!onUpdateRole) return
    setUpdatingRoleFor(memberId)
    try {
      await onUpdateRole(memberId, newRole)
    } finally {
      setUpdatingRoleFor(null)
    }
  }

  return (
    <div className='rounded-xl border border-border/60 bg-card/50'>
      <h4 className='border-border/40 border-b px-4 py-3 font-semibold text-[13px] text-foreground'>
        Team Members
      </h4>
      <div className='divide-y divide-border/40'>
        {organization.members.map((m: Member) => {
          const isSelf = m.user?.email === currentUserEmail
          const canChangeRole = isOwner && m.role !== 'owner' && !isSelf && onUpdateRole
          const isUpdating = updatingRoleFor === m.user?.id

          return (
            <div key={m.id} className='flex items-center justify-between px-4 py-3'>
              <div className='flex-1'>
                <div className='flex items-center gap-3'>
                  <div className='flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 font-semibold text-[12px] text-primary'>
                    {(m.user?.name || m.user?.email || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className='min-w-0 flex-1'>
                    <div className='font-medium text-[13px] text-foreground'>
                      {m.user?.name || 'Unknown'}
                    </div>
                    <div className='text-[12px] text-muted-foreground'>{m.user?.email}</div>
                  </div>

                  {/* Role badge or select */}
                  {canChangeRole ? (
                    <Select
                      value={m.role}
                      onValueChange={(value) => handleRoleChange(m.user?.id || m.id, value)}
                      disabled={isUpdating}
                    >
                      <SelectTrigger className='h-7 w-[100px] rounded-lg text-[11px]'>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className='rounded-lg'>
                        <SelectItem value='admin' className='text-[12px]'>
                          <div className='flex items-center gap-1.5'>
                            <ShieldCheck className='h-3 w-3' />
                            Admin
                          </div>
                        </SelectItem>
                        <SelectItem value='member' className='text-[12px]'>
                          <div className='flex items-center gap-1.5'>
                            <Shield className='h-3 w-3' />
                            Member
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className='rounded-lg bg-muted/60 px-2.5 py-1 font-medium text-[11px] text-muted-foreground'>
                      {m.role.charAt(0).toUpperCase() + m.role.slice(1)}
                    </div>
                  )}
                </div>
              </div>

              {/* Only show remove button for non-owners and if current user is admin/owner */}
              {isAdminOrOwner && m.role !== 'owner' && !isSelf && (
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => onRemoveMember(m)}
                  className='h-7 w-7 rounded-lg p-0 text-muted-foreground hover:text-destructive'
                >
                  <UserX className='h-3.5 w-3.5' />
                </Button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
