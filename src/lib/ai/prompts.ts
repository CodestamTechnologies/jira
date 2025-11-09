const TASK_VALIDATION_PROMPT_TEMPLATE = `Task Validation Logic

Goal: Confirm the task is specific, actionable, and trackable.

Required Fields:
1. Objective — Defines exactly what action or change must occur.
2. Deliverable — Identifiable artifact, document, update, or result produced.
3. Expected Outcome — Quantifiable or verifiable indicator proving success (metric, URL, state, or condition).

Inputs:
Task Name: {taskName}
Task Description: {taskDescription}

Validation Steps:
1. Parse taskDescription for explicit verbs (e.g., build, create, update, test). Missing verbs → vague.
2. Check for a tangible deliverable (file, report, feature, document, etc.). Missing output → non-trackable.
3. Detect an outcome statement or verification method (metric, link, completion condition). Missing → unverifiable.
4. If any of the above are absent or ambiguous, return:
   {
     "error": true,
     "reason": "<clear missing or vague element> - This message must be easy to understand by a non tech small kid as well. "
   }
5. If all three are clear, return:
   {
     "error": false,
     "reason": "Task is specific, actionable, and verifiable."
   }

Notes:
- Reject subjective phrasing (“improve performance,” “make better UI”) unless measurable criteria are given.
- Support objective phrasing (“increase load speed by 20%,” “create dashboard endpoint”).  
`;

export const buildTaskValidationPrompt = (name: string, description?: string): string => {
  return TASK_VALIDATION_PROMPT_TEMPLATE.replace('{taskName}', name).replace(
    '{taskDescription}',
    description?.trim() || 'No description provided',
  );
};
