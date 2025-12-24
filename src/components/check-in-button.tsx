'use client';

import { LogIn, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useGetTodayAttendance } from '@/features/attendance/api/use-get-today-attendance';
import { useCheckIn } from '@/features/attendance/api/use-check-in';
import { useLocation } from '@/features/attendance/hooks/use-location';
import { useCurrent } from '@/features/auth/api/use-current';
import { useWorkspaceId } from '@/features/workspaces/hooks/use-workspace-id';

/**
 * CheckInButton Component
 * 
 * Displays a check-in button in the header that allows users to check in for the day.
 * Only visible when:
 * - User is in a workspace context
 * - User is logged in
 * - User hasn't checked in today
 * 
 * Features:
 * - Automatic location detection
 * - Loading states
 * - Error handling
 * - Query invalidation for real-time updates
 * 
 * @example
 * ```tsx
 * <CheckInButton />
 * ```
 */
export const CheckInButton = () => {
  const workspaceId = useWorkspaceId();
  const { data: user } = useCurrent();

  // Location hook for check-in - cached to avoid repeated requests
  const {
    location,
    isLoadingLocation,
    getCurrentLocation,
  } = useLocation({ maxRetries: 3, timeout: 15000 });

  // Check today's attendance to determine if user has already checked in
  // Only fetch if we have both workspaceId and userId
  const { data: todayAttendance } = useGetTodayAttendance(
    workspaceId,
    user?.$id,
    { enabled: !!workspaceId && !!user?.$id }
  );

  // Check-in mutation with automatic query invalidation
  const checkInMutation = useCheckIn();

  // Early return if conditions aren't met (performance optimization)
  if (!workspaceId || !user || todayAttendance) {
    return null;
  }

  /**
   * Handles the check-in process
   * - Gets current location if not already cached
   * - Calls check-in mutation
   * - Mutation automatically invalidates queries via useCheckIn hook
   */
  const handleCheckIn = async () => {
    let currentLocation = location;

    // Fetch location if not cached
    if (!currentLocation) {
      try {
        currentLocation = await getCurrentLocation();
      } catch (error) {
        // Error is already handled by useLocation hook
        return;
      }
    }

    if (currentLocation) {
      checkInMutation.mutate({
        workspaceId,
        checkInLatitude: currentLocation.latitude,
        checkInLongitude: currentLocation.longitude,
        checkInAddress: currentLocation.address,
      });
      // Note: Query invalidation is handled in useCheckIn hook
      // No need for manual refetch
    }
  };

  const isProcessing = checkInMutation.isPending || isLoadingLocation;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCheckIn}
            disabled={isProcessing}
            aria-label="Check in"
          >
            {isProcessing ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span className="sr-only">Checking in...</span>
              </>
            ) : (
              <>
                <LogIn className="size-4" />
                <span className="sr-only">Check in</span>
              </>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Check in</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
