'use client'

import { useState, useRef, useEffect } from 'react'
import { MemberAvatar } from '@/features/members/components/member-avatar'
import { cn } from '@/lib/utils'

interface MentionAutocompleteProps {
  members: Array<{ userId: string; name: string; email: string }>
  query: string
  onSelect: (member: { userId: string; name: string; email: string }) => void
  position: { top: number; left: number }
  onSelectFirst?: () => void
}

export const MentionAutocomplete = ({
  members,
  query,
  onSelect,
  position,
  onSelectFirst,
}: MentionAutocompleteProps) => {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const filteredMembers = members
    .filter(
      (member) =>
        member.name.toLowerCase().includes(query.toLowerCase()) ||
        member.email.toLowerCase().includes(query.toLowerCase())
    )
    .sort((a, b) => {
      // Sort by name first, then email
      const nameCompare = a.name.localeCompare(b.name)
      if (nameCompare !== 0) return nameCompare
      return a.email.localeCompare(b.email)
    })

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) => Math.min(prev + 1, filteredMembers.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => Math.max(prev - 1, 0))
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault()
        if (filteredMembers[selectedIndex]) {
          onSelect(filteredMembers[selectedIndex])
        } else if (onSelectFirst && filteredMembers.length > 0) {
          onSelectFirst()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedIndex, filteredMembers, onSelect, onSelectFirst])

  // Scroll selected item into view
  useEffect(() => {
    if (containerRef.current) {
      const selectedElement = containerRef.current.children[selectedIndex] as HTMLElement
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      }
    }
  }, [selectedIndex])

  if (filteredMembers.length === 0) return null

  return (
    <div
      ref={containerRef}
      className="fixed z-50 w-64 rounded-md border bg-popover shadow-md"
      style={{ top: `${position.top}px`, left: `${position.left}px` }}
    >
      <div className="max-h-60 overflow-auto p-1">
        {filteredMembers.map((member, index) => (
          <div
            key={member.userId}
            className={cn(
              'flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer',
              index === selectedIndex && 'bg-accent'
            )}
            onMouseEnter={() => setSelectedIndex(index)}
            onClick={() => onSelect(member)}
          >
            <MemberAvatar name={member.name} className="w-6 h-6" />
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{member.name}</div>
              <div className="text-xs text-muted-foreground truncate">
                {member.email}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
