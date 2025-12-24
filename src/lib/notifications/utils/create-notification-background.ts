/**
 * Create notification in background without blocking the request
 * Follows the same pattern as sendEmailBackground for consistency
 * 
 * Uses setImmediate to defer execution to next event loop tick
 */
export const createNotificationBackground = async (
  notificationFn: () => Promise<void>
): Promise<void> => {
  // Use setImmediate to defer to next event loop tick, making it non-blocking
  setImmediate(async () => {
    try {
      await notificationFn();
    } catch (error) {
      console.error('Background notification creation failed:', error);
      // Don't throw - we don't want background errors to affect the main flow
    }
  });
};


