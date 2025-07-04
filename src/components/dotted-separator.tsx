import { cn } from '@/lib/utils';
import { forwardRef } from 'react';

interface DottedSeparatorProps {
  className?: string;
  color?: string;
  height?: string;
  dotSize?: string;
  gapSize?: string;
  direction?: 'horizontal' | 'vertical';
  opacity?: number;
  variant?: 'default' | 'dense' | 'sparse';
  'aria-label'?: string;
  role?: 'separator' | 'presentation';
}

const VARIANT_CONFIGS = {
  default: { dotSize: '2px', gapSize: '4px' },
  dense: { dotSize: '1px', gapSize: '2px' },
  sparse: { dotSize: '3px', gapSize: '8px' },
} as const;

export const DottedSeparator = forwardRef<HTMLDivElement, DottedSeparatorProps>(
  ({
    className,
    color = '#d4d4d8',
    direction = 'horizontal',
    dotSize,
    gapSize,
    height = '2px',
    opacity = 1,
    variant = 'default',
    'aria-label': ariaLabel,
    role = 'separator',
    ...props
  }, ref) => {
    const isHorizontal = direction === 'horizontal';
    
    // Use variant config as fallback if specific sizes aren't provided
    const config = VARIANT_CONFIGS[variant];
    const finalDotSize = dotSize || config.dotSize;
    const finalGapSize = gapSize || config.gapSize;
    
    // Parse sizes safely with fallbacks
    const parsedDotSize = parseInt(finalDotSize) || 2;
    const parsedGapSize = parseInt(finalGapSize) || 4;
    const parsedHeight = parseInt(height) || 2;
    
    // Calculate background pattern for dashes
    const patternSize = parsedDotSize + parsedGapSize;
    const colorWithOpacity = opacity !== 1 ? `${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}` : color;
    
    const backgroundImage = isHorizontal
      ? `linear-gradient(to right, ${colorWithOpacity} 0%, ${colorWithOpacity} ${(parsedDotSize / patternSize) * 100}%, transparent ${(parsedDotSize / patternSize) * 100}%, transparent 100%)`
      : `linear-gradient(to bottom, ${colorWithOpacity} 0%, ${colorWithOpacity} ${(parsedDotSize / patternSize) * 100}%, transparent ${(parsedDotSize / patternSize) * 100}%, transparent 100%)`;
    
    const backgroundSize = isHorizontal 
      ? `${patternSize}px ${parsedHeight}px`
      : `${parsedHeight}px ${patternSize}px`;
    
    return (
      <div
        ref={ref}
        className={cn(
          // Base styles
          'flex items-center justify-center',
          // Direction-specific styles
          isHorizontal 
            ? 'w-full min-h-0' 
            : 'h-full min-w-0 flex-col',
          // Focus styles for accessibility
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
          className
        )}
        role={role}
        aria-label={ariaLabel || `${direction} dashed separator`}
        aria-orientation={isHorizontal ? 'horizontal' : 'vertical'}
        {...props}
      >
        <div
          aria-hidden="true"
          className={cn(
            // Ensure proper sizing
            isHorizontal ? 'w-full' : 'h-full',
            // Add subtle animation on hover for better UX
            'transition-opacity duration-200 hover:opacity-80'
          )}
          style={{
            width: isHorizontal ? '100%' : `${parsedHeight}px`,
            height: isHorizontal ? `${parsedHeight}px` : '100%',
            backgroundImage,
            backgroundSize,
            backgroundRepeat: isHorizontal ? 'repeat-x' : 'repeat-y',
            backgroundPosition: 'center',
            // Ensure crisp rendering
            imageRendering: 'pixelated',
          }}
        />
      </div>
    );
  }
);

DottedSeparator.displayName = 'DottedSeparator';

// Export variant configurations for external use
export const DottedSeparatorVariants = VARIANT_CONFIGS;
