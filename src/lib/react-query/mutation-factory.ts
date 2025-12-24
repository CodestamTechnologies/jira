/**
 * React Query Mutation Factory
 * 
 * Factory function to create standardized mutation hooks following DRY principle.
 * Reduces code duplication across 60+ mutation hooks in the codebase.
 * 
 * @module lib/react-query/mutation-factory
 */

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { QueryKey } from '@tanstack/react-query';

import { RETRY_CONFIG } from './constants';
// Cache invalidation functions are imported where needed

/**
 * Configuration for mutation factory
 */
export interface MutationFactoryConfig<TData, TError, TVariables, TContext> {
  /** Mutation function that performs the API call */
  mutationFn: (variables: TVariables) => Promise<TData>;

  /** Success message to show in toast */
  successMessage?: string | ((data: TData, variables: TVariables) => string);

  /** Error message to show in toast */
  errorMessage?: string | ((error: TError) => string);

  /** Function to invalidate cache on success */
  onSuccessInvalidate?: (
    queryClient: ReturnType<typeof useQueryClient>,
    data: TData,
    variables: TVariables
  ) => void;

  /** Custom success handler (called after cache invalidation) */
  onSuccessCustom?: (data: TData, variables: TVariables) => void;

  /** Custom error handler (called before default error handling) */
  onErrorCustom?: (error: TError, variables: TVariables) => void;

  /** Log prefix for error logging */
  logPrefix?: string;

  /** Whether to show success toast (default: true) */
  showSuccessToast?: boolean;

  /** Whether to show error toast (default: true) */
  showErrorToast?: boolean;

  /** Additional React Query mutation options */
  mutationOptions?: Omit<
    UseMutationOptions<TData, TError, TVariables, TContext>,
    'mutationFn' | 'onSuccess' | 'onError'
  >;
}

/**
 * Creates a standardized mutation hook
 * 
 * @example
 * ```typescript
 * const useCreateTask = () => {
 *   return createMutation({
 *     mutationFn: async (data) => {
 *       const response = await client.api.tasks.$post({ json: data });
 *       if (!response.ok) throw new Error('Failed to create task');
 *       return response.json();
 *     },
 *     successMessage: 'Task created successfully',
 *     logPrefix: '[CREATE_TASK]',
 *     onSuccessInvalidate: (queryClient, data) => {
 *       invalidateTaskQueries(queryClient, data.$id, data.workspaceId, data.projectId);
 *     },
 *   });
 * };
 * ```
 */
export function createMutation<TData, TError = Error, TVariables = void, TContext = unknown>(
  config: MutationFactoryConfig<TData, TError, TVariables, TContext>
) {
  return () => {
    const queryClient = useQueryClient();

    return useMutation<TData, TError, TVariables, TContext>({
      mutationFn: config.mutationFn,
      retry: RETRY_CONFIG.MUTATIONS, // Don't retry mutations by default
      ...config.mutationOptions,
      onSuccess: (data, variables, context) => {
        // Invalidate cache if handler provided
        if (config.onSuccessInvalidate) {
          config.onSuccessInvalidate(queryClient, data, variables);
        }

        // Show success toast
        if (config.showSuccessToast !== false) {
          const message =
            typeof config.successMessage === 'function'
              ? config.successMessage(data, variables)
              : config.successMessage || 'Operation completed successfully';
          toast.success(message);
        }

        // Call custom success handler
        if (config.onSuccessCustom) {
          config.onSuccessCustom(data, variables);
        }
      },
      onError: (error, variables, context) => {
        // Log error
        const prefix = config.logPrefix || '[MUTATION]';
        console.error(`${prefix}:`, error);

        // Show error toast
        if (config.showErrorToast !== false) {
          const message =
            typeof config.errorMessage === 'function'
              ? config.errorMessage(error)
              : config.errorMessage ||
                (error instanceof Error ? error.message : 'Operation failed');
          toast.error(message);
        }

        // Call custom error handler
        if (config.onErrorCustom) {
          config.onErrorCustom(error, variables);
        }
      },
    });
  };
}
