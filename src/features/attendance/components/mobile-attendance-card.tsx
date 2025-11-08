'use client';

import { useState, useEffect } from 'react';
import { Clock, MapPin, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useCheckIn } from '../api/use-check-in';
import { useCheckOut } from '../api/use-check-out';
import { useGetTodayAttendance } from '../api/use-get-today-attendance';
import { useWorkspaceId } from '@/features/workspaces/hooks/use-workspace-id';
import { useCurrent } from '@/features/auth/api/use-current';
import { CheckoutDialog } from './checkout-dialog';
import { useLocation } from '../hooks/use-location';

export const MobileAttendanceCard = () => {
  const [checkoutDialogOpen, setCheckoutDialogOpen] = useState(false);
  const {
    location,
    locationError,
    isLoadingLocation,
    getCurrentLocation,
    refreshLocation,
  } = useLocation({ maxRetries: 3, timeout: 15000 });

  const workspaceId = useWorkspaceId();
  const { data: user } = useCurrent();
  const { data: todayAttendance, refetch: refetchToday } = useGetTodayAttendance(workspaceId, user?.$id);
  const checkInMutation = useCheckIn();
  const checkOutMutation = useCheckOut();

  // Cache location for a short period to avoid refetching
  useEffect(() => {
    if (location && !checkoutDialogOpen) {
      // Location is cached, no need to refetch immediately
    }
  }, [location, checkoutDialogOpen]);

  const handleCheckIn = async () => {
    let currentLocation = location;
    
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
      }, {
        onSuccess: () => {
          refetchToday();
        },
      });
    }
  };

  const handleCheckOutClick = async () => {
    // Open dialog first, location will be fetched if needed
    setCheckoutDialogOpen(true);
    
    // Fetch location if not available
    if (!location) {
      try {
        await getCurrentLocation();
      } catch (error) {
        // Error is already handled by useLocation hook
        // Dialog will show the error and allow retry
      }
    }
  };

  const handleRetryLocation = async () => {
    try {
      await refreshLocation();
    } catch (error) {
      // Error is already handled by useLocation hook
    }
  };

  const handleCheckOut = (data: { checkOutLatitude: number; checkOutLongitude: number; checkOutAddress?: string; notes: string }) => {
    checkOutMutation.mutate(data, {
      onSuccess: () => {
        refetchToday();
        setCheckoutDialogOpen(false);
      },
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'late':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'absent':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'half-day':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-800';
      case 'late':
        return 'bg-yellow-100 text-yellow-800';
      case 'absent':
        return 'bg-red-100 text-red-800';
      case 'half-day':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const isCheckedIn = todayAttendance && todayAttendance.checkInTime && !todayAttendance.checkOutTime;
  const isCheckedOut = todayAttendance && todayAttendance.checkOutTime;

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock className="h-5 w-5" />
          Attendance
        </CardTitle>
        <CardDescription className="text-sm">
          {format(new Date(), 'EEEE, MMMM do, yyyy')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Status:</span>
          {todayAttendance ? (
            <Badge className={getStatusColor(todayAttendance.status)}>
              <div className="flex items-center gap-1">
                {getStatusIcon(todayAttendance.status)}
                <span className="text-xs">
                  {todayAttendance.status.charAt(0).toUpperCase() + todayAttendance.status.slice(1)}
                </span>
              </div>
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-xs">Ready to Check In</Badge>
          )}
        </div>

        {/* Check In/Out Times */}
        {todayAttendance && (
          <div className="space-y-2 text-sm">
            {todayAttendance.checkInTime && (
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>In: {format(new Date(todayAttendance.checkInTime), 'HH:mm')}</span>
              </div>
            )}
            {todayAttendance.checkOutTime && (
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-500" />
                <span>Out: {format(new Date(todayAttendance.checkOutTime), 'HH:mm')}</span>
              </div>
            )}
            {todayAttendance.totalHours && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-500" />
                <span>Total: {todayAttendance.totalHours.toFixed(2)}h</span>
              </div>
            )}
          </div>
        )}

        {/* Location Error */}
        {locationError && !checkoutDialogOpen && (
          <Alert variant="destructive" className="text-xs">
            <AlertCircle className="h-3 w-3" />
            <AlertDescription className="flex items-center justify-between text-xs">
              <span>{locationError}</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRetryLocation}
                className="ml-2 h-6 text-xs px-2"
              >
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="space-y-2">
          {!todayAttendance && (
            <Button
              onClick={handleCheckIn}
              disabled={checkInMutation.isPending || isLoadingLocation}
              className="w-full h-12 text-base"
            >
              {isLoadingLocation ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Getting Location...
                </>
              ) : (
                'Check In'
              )}
            </Button>
          )}

          {isCheckedIn && (
            <>
              <Button
                onClick={handleCheckOutClick}
                disabled={checkOutMutation.isPending || isLoadingLocation}
                variant="outline"
                className="w-full h-12 text-base"
              >
                {isLoadingLocation ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Getting Location...
                  </>
                ) : (
                  'Check Out'
                )}
              </Button>
              <CheckoutDialog
                open={checkoutDialogOpen}
                onOpenChange={setCheckoutDialogOpen}
                onCheckOut={handleCheckOut}
                location={location}
                isLoadingLocation={isLoadingLocation}
                isPending={checkOutMutation.isPending}
                locationError={locationError}
                onRetryLocation={handleRetryLocation}
              />
            </>
          )}

          {isCheckedOut && (
            <div className="text-center text-sm text-gray-500 py-2">
              ✅ Completed for today
            </div>
          )}
        </div>

        {/* Location Info */}
        {location && (
          <div className="text-xs  p-2 rounded">
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span>Location captured</span>
            </div>
            {location.address && (
              <div className="mt-1 truncate text-xs">{location.address}</div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
