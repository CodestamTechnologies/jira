/**
 * Send email in background without blocking the request
 * Uses setImmediate to defer execution to next event loop tick
 */
export const sendEmailBackground = async (
  emailFn: () => Promise<void>
): Promise<void> => {
  // Use setImmediate to defer to next event loop tick, making it non-blocking
  setImmediate(async () => {
    try {
      await emailFn()
    } catch (error) {
      console.error('Background email sending failed:', error)
      // Don't throw - we don't want background errors to affect the main flow
    }
  })
}
