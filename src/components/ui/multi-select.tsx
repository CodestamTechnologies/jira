'use client';

import { Check, ChevronsUpDown, X } from 'lucide-react';
import * as React from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface Option {
  label: string;
  value: string;
  avatar?: React.ReactNode;
}

interface MultiSelectProps {
  options: Option[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const MultiSelect = React.forwardRef<HTMLButtonElement, MultiSelectProps>(
  ({ options, selected, onChange, placeholder = 'Select items...', disabled, className }, ref) => {
    const [open, setOpen] = React.useState(false);
    const [width, setWidth] = React.useState<number | undefined>(undefined);
    const triggerRef = React.useRef<HTMLButtonElement | null>(null);
    const scrollContainerRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
      if (open && triggerRef.current) {
        setWidth(triggerRef.current.offsetWidth);
      }
    }, [open]);

    const handleUnselect = (value: string, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onChange(selected.filter((s) => s !== value));
    };

    const handleSelect = (value: string) => {
      if (selected.includes(value)) {
        onChange(selected.filter((s) => s !== value));
      } else {
        onChange([...selected, value]);
      }
    };

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={(node) => {
              triggerRef.current = node;
              if (typeof ref === 'function') {
                ref(node);
              } else if (ref && 'current' in ref) {
                (ref as React.MutableRefObject<HTMLButtonElement | null>).current = node;
              }
            }}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn('h-auto min-h-10 w-full justify-between', className)}
            disabled={disabled}
            onClick={() => setOpen(!open)}
          >
            <div className="flex flex-1 flex-wrap gap-1 overflow-hidden">
              {selected.length === 0 ? (
                <span className="text-muted-foreground">{placeholder}</span>
              ) : (
                selected.map((value) => {
                  const option = options.find((opt) => opt.value === value);
                  return (
                    <Badge
                      variant="secondary"
                      key={value}
                      className="mr-1 mb-1"
                      onClick={(e) => handleUnselect(value, e)}
                    >
                      {option?.avatar && <span className="mr-1">{option.avatar}</span>}
                      {option?.label ?? value}
                      <button
                        className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleUnselect(value, e as any);
                          }
                        }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        onClick={(e) => handleUnselect(value, e)}
                      >
                        <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                      </button>
                    </Badge>
                  );
                })
              )}
            </div>
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="p-0 z-[100]"
          align="start"
          sideOffset={4}
          onOpenAutoFocus={(e) => e.preventDefault()}
          style={{
            width: width ? `${width}px` : 'auto',
            padding: 0,
          }}
        >
          <div
            ref={scrollContainerRef}
            className="max-h-[300px] overflow-y-auto overflow-x-hidden"
            style={{
              maxHeight: '300px',
              overflowY: 'auto',
              overflowX: 'hidden',
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'thin',
            }}
          >
            <div className="p-1">
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={cn(
                    'relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
                    selected.includes(option.value) && 'bg-accent',
                  )}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSelect(option.value);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSelect(option.value);
                    }
                  }}
                  role="option"
                  aria-selected={selected.includes(option.value)}
                >
                  <div className="flex flex-1 items-center gap-2">
                    {option.avatar && <span>{option.avatar}</span>}
                    <span>{option.label}</span>
                  </div>
                  {selected.includes(option.value) && <Check className="h-4 w-4 shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    );
  },
);

MultiSelect.displayName = 'MultiSelect';
