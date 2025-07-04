"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { cn } from '@/lib/utils';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function ModeToggle() {
  const { setTheme, theme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div
          className={cn(
            'flex size-10 items-center justify-center rounded-full border border-input bg-background shadow-sm transition hover:bg-accent focus-visible:ring-1 focus-visible:ring-ring outline-none',
            'relative',
          )}
          tabIndex={0}
          role="button"
          aria-label="Toggle theme"
        >
          <Sun
            className={cn(
              'h-3.5 w-3.5 transition-all',
              theme === 'dark' ? 'scale-0 rotate-90 absolute' : 'scale-100 rotate-0',
              'text-muted-foreground'
            )}
          />
          <Moon
            className={cn(
              'h-3.5 w-3.5 transition-all',
              theme === 'dark' ? 'scale-100 rotate-0' : 'scale-0 -rotate-90 absolute',
              'text-muted-foreground'
            )}
          />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={10}>
        <DropdownMenuItem onClick={() => setTheme('light')}>Light</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')}>Dark</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')}>System</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
