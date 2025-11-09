import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';

import type { TaskValidationInput, TaskValidationResponse } from '../types';
import { taskValidationResponseSchema } from '../types';
import { buildTaskValidationPrompt } from '../prompts';

export class TaskValidationService {
  private static modelInstance: ReturnType<typeof google> | null = null;

  private get model() {
    if (!TaskValidationService.modelInstance) {
      TaskValidationService.modelInstance = google('gemini-2.5-flash');
    }
    return TaskValidationService.modelInstance;
  }

  async validateTask(input: TaskValidationInput): Promise<TaskValidationResponse> {
    try {
      const prompt = buildTaskValidationPrompt(input.name, input.description);

      const result = await generateObject({
        model: this.model,
        schema: taskValidationResponseSchema,
        prompt,
        temperature: 0.5,
      });

      return result.object;
    } catch (error) {
      console.error('[TaskValidationService] Error:', error);

      return {
        error: true,
        message: 'AI service temporarily unavailable. Please ensure your task includes: objective, deliverable, and expected outcome.',
      };
    }
  }
}

export const createTaskValidationService = () => new TaskValidationService();
