import { useMutation } from '@tanstack/react-query';

import { client } from '@/lib/hono';
import type { TaskValidationResponse } from '@/lib/ai/types';

type RequestType = {
  json: {
    name: string;
    description?: string;
  };
};

type ResponseType = {
  data: TaskValidationResponse;
};

export const useValidateTask = () => {
  return useMutation<ResponseType, Error, RequestType>({
    mutationFn: async ({ json }) => {
      const response = await client.api.tasks.validate.$post({ json });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to validate task.' }));
        const errorMessage = typeof errorData === 'object' && 'error' in errorData ? String(errorData.error) : 'Failed to validate task.';
        throw new Error(errorMessage);
      }

      return await response.json();
    },
  });
};
