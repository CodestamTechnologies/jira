import { zValidator } from '@hono/zod-validator';
import { subDays } from 'date-fns';
import { Hono } from 'hono';
import { ID, Models, Query } from 'node-appwrite';
import { z } from 'zod';

import { DATABASE_ID, IMAGES_BUCKET_ID, MEMBERS_ID, PROJECTS_ID, TASKS_ID, COMMENTS_ID, WORKSPACES_ID } from '@/config/db';
import { ActivityAction, ActivityEntityType } from '@/features/activity-logs/types';
import { getUserInfoForLogging } from '@/features/activity-logs/utils/get-user-info';
import { getChangedFields } from '@/features/activity-logs/utils/log-activity';
import { logActivityBackground } from '@/lib/activity-logs/utils/log-activity-background';
import { getRequestMetadata } from '@/features/activity-logs/utils/get-request-metadata';
import { MemberRole } from '@/features/members/types';
import { getMember } from '@/features/members/utils';
import type { Project } from '@/features/projects/types';
import { createTaskSchema } from '@/features/tasks/schema';
import { type Task, TaskStatus, type Comment } from '@/features/tasks/types';
import { createAdminClient } from '@/lib/appwrite';
import { sessionMiddleware } from '@/lib/session-middleware';
import commentsRoute from './comments';
import { validateTaskSchema } from './ai-validation';
import { createTaskValidationService } from '@/lib/ai';
import { NotificationService } from '@/lib/email/services/notification-service';
import type { Workspace } from '@/features/workspaces/types';

const app = new Hono()
  .get(
    '/',
    sessionMiddleware,
    zValidator(
      'query',
      z.object({
        workspaceId: z.string(),
        projectId: z.string().nullish(),
        assigneeId: z.string().nullish(),
        status: z.nativeEnum(TaskStatus).nullish(),
        search: z.string().nullish(),
        dueDate: z.string().nullish(),
        showAll: z.string().optional(), // 'true' to show all tasks including old done ones
      }),
    ),
    async (ctx) => {
      const { users } = await createAdminClient();
      const databases = ctx.get('databases');
      const storage = ctx.get('storage');
      const user = ctx.get('user');

      const { workspaceId, projectId, assigneeId, status, search, dueDate, showAll } =
        ctx.req.valid('query');

      const member = await getMember({
        databases,
        workspaceId,
        userId: user.$id,
      });

      if (!member) {
        return ctx.json({ error: 'Unauthorized.' }, 401);
      }

      // Admins can see all tasks, regular members only see tasks from projects they have tasks in
      const isAdmin = member.role === MemberRole.ADMIN;
      let allowedProjectIds: string[] | null = null;

      if (!isAdmin) {
        // Find all tasks where the user is assigned to get project IDs
        const userTasks = await databases.listDocuments<Task>(DATABASE_ID, TASKS_ID, [
          Query.equal('workspaceId', workspaceId),
          Query.contains('assigneeIds', member.$id),
        ]);

        // Get unique project IDs from user's tasks
        allowedProjectIds = Array.from(new Set(userTasks.documents.map((task) => task.projectId)));

        // If user has no tasks, return empty result
        if (allowedProjectIds.length === 0) {
          return ctx.json({
            data: {
              documents: [],
              total: 0,
            },
          });
        }
      }

      const query = [Query.equal('workspaceId', workspaceId), Query.orderDesc('$createdAt')];

      if (projectId) {
        // If filtering by specific project, verify user has access (if not admin)
        if (!isAdmin && allowedProjectIds && !allowedProjectIds.includes(projectId)) {
          return ctx.json({
            data: {
              documents: [],
              total: 0,
            },
          });
        }
        query.push(Query.equal('projectId', projectId));
      }

      if (status) query.push(Query.equal('status', status));

      if (assigneeId) query.push(Query.contains('assigneeIds', assigneeId));

      if (dueDate) query.push(Query.equal('dueDate', dueDate));

      if (search) query.push(Query.search('name', search));

      const tasks = await databases.listDocuments<Task>(DATABASE_ID, TASKS_ID, query);

      // Filter tasks by allowed project IDs if user is not admin
      let filteredTasks = tasks;
      if (!isAdmin && allowedProjectIds && allowedProjectIds.length > 0) {
        filteredTasks = {
          ...tasks,
          documents: tasks.documents.filter((task) => allowedProjectIds!.includes(task.projectId)),
          total: tasks.documents.filter((task) => allowedProjectIds!.includes(task.projectId)).length,
        };
      }

      // Filter out tasks marked as DONE for more than 7 days when viewing all tasks (not project-specific)
      // When viewing tasks of a specific project, show all tasks including old done ones
      // If showAll=true, bypass this filter
      if (!projectId && showAll !== 'true') {
        const sevenDaysAgo = subDays(new Date(), 7).toISOString();
        const filteredDocuments = filteredTasks.documents.filter((task) => {
          // Keep task if it's not DONE, or if it's DONE but was updated within last 7 days
          return task.status !== TaskStatus.DONE || task.$updatedAt >= sevenDaysAgo;
        });

        filteredTasks = {
          ...filteredTasks,
          documents: filteredDocuments,
          total: filteredDocuments.length,
        };
      }

      const projectIds = filteredTasks.documents.map((task) => task.projectId);
      const allAssigneeIds = filteredTasks.documents.flatMap((task) => task.assigneeIds || []);

      const projects = await databases.listDocuments<Project>(
        DATABASE_ID,
        PROJECTS_ID,
        projectIds.length > 0 ? [Query.contains('$id', projectIds)] : [],
      );

      // Fix for Set iteration compatibility: avoid using spread operator directly on Set
      const uniqueAssigneeIds: string[] = Array.from(new Set(allAssigneeIds));

      const members = await databases.listDocuments(
        DATABASE_ID,
        MEMBERS_ID,
        uniqueAssigneeIds.length > 0 ? [Query.contains('$id', uniqueAssigneeIds)] : [],
      );

      const assignees = await Promise.all(
        members.documents.map(async (member) => {
          const user = await users.get(member.userId);

          // Only return safe, non-sensitive fields
          return {
            $id: member.$id,
            userId: member.userId,
            name: user.name,
            email: user.email,
            role: member.role,
          };
        }),
      );

      const populatedTasks: (Models.Document & Task)[] = await Promise.all(
        filteredTasks.documents.map(async (task) => {
          const project = projects.documents.find((project) => project.$id === task.projectId);
          const taskAssignees = (task.assigneeIds || []).map((assigneeId) =>
            assignees.find((assignee) => assignee.$id === assigneeId),
          ).filter(Boolean) as Array<{ $id: string; name: string; email?: string }>;

          let imageUrl: string | undefined = undefined;

          if (project?.imageId) {
            const arrayBuffer = await storage.getFileView(IMAGES_BUCKET_ID, project.imageId);
            imageUrl = `data:image/png;base64,${Buffer.from(arrayBuffer).toString('base64')}`;
          }

          return {
            ...task,
            project: {
              ...project,
              imageUrl,
            },
            assignees: taskAssignees,
            assignee: taskAssignees[0], // For backward compatibility
          };
        }),
      );

      return ctx.json({
        data: {
          ...filteredTasks,
          documents: populatedTasks,
        },
      });
    },
  )
  .get('/:taskId', sessionMiddleware, async (ctx) => {
    const { taskId } = ctx.req.param();
    const currentUser = ctx.get('user');
    const databases = ctx.get('databases');

    const { users } = await createAdminClient();

    const task = await databases.getDocument<Task>(DATABASE_ID, TASKS_ID, taskId);

    const currentMember = await getMember({
      databases,
      workspaceId: task.workspaceId,
      userId: currentUser.$id,
    });

    if (!currentMember) {
      return ctx.json({ error: 'Unauthorized.' }, 401);
    }

    // Admins can access all tasks, regular members only access tasks from projects they have tasks in
    const isAdmin = currentMember.role === MemberRole.ADMIN;

    if (!isAdmin) {
      // Check if user has tasks in this project
      const userTasksInProject = await databases.listDocuments<Task>(DATABASE_ID, TASKS_ID, [
        Query.equal('projectId', task.projectId),
        Query.contains('assigneeIds', currentMember.$id),
      ]);

      if (userTasksInProject.total === 0) {
        return ctx.json(
          {
            error: 'Unauthorized. You do not have access to this task.',
          },
          403,
        );
      }
    }

    const project = await databases.getDocument<Project>(DATABASE_ID, PROJECTS_ID, task.projectId);

    const assigneeIds = task.assigneeIds || [];
    const members = await Promise.all(
      assigneeIds.map((assigneeId) => databases.getDocument(DATABASE_ID, MEMBERS_ID, assigneeId)),
    );

    const assignees = await Promise.all(
      members.map(async (member) => {
        const user = await users.get(member.userId);
        // Only return safe, non-sensitive fields
        return {
          $id: member.$id,
          userId: member.userId,
          name: user.name,
          email: user.email,
          role: member.role,
        };
      }),
    );

    return ctx.json({
      data: {
        ...task,
        project,
        assignees,
        assignee: assignees[0], // For backward compatibility
      },
    });
  })
  .post('/', sessionMiddleware, zValidator('json', createTaskSchema), async (ctx) => {
    const user = ctx.get('user');
    const databases = ctx.get('databases');

    const { name, status, workspaceId, projectId, dueDate, assigneeIds, description } = ctx.req.valid('json');

    const member = await getMember({
      databases,
      workspaceId,
      userId: user.$id,
    });

    if (!member) {
      return ctx.json({ error: 'Unauthorized.' }, 401);
    }

    const highestPositionTask = await databases.listDocuments(DATABASE_ID, TASKS_ID, [
      Query.equal('status', status),
      Query.equal('workspaceId', workspaceId),
      Query.orderAsc('position'),
      Query.limit(1),
    ]);

    const newPosition = highestPositionTask.documents.length > 0 ? highestPositionTask.documents[0].position + 1000 : 1000;

    const task = await databases.createDocument<Task>(DATABASE_ID, TASKS_ID, ID.unique(), {
      name,
      status,
      workspaceId,
      projectId,
      dueDate: dueDate instanceof Date ? dueDate.toISOString() : dueDate,
      assigneeIds,
      position: newPosition,
      description: description && description.trim() ? description.trim() : undefined,
    });

    // Send email notifications and log activity in background (non-blocking)
    const workspace = await databases.getDocument<Workspace>(DATABASE_ID, WORKSPACES_ID, workspaceId);
    const project = projectId ? await databases.getDocument<Project>(DATABASE_ID, PROJECTS_ID, projectId) : null;
    const notificationService = new NotificationService(databases);
    
    if (assigneeIds && assigneeIds.length > 0) {
      notificationService.notifyTaskCreated(
        task,
        workspace.name,
        project?.name || 'No Project',
        user.$id,
        assigneeIds
      );
    }

    const userInfo = getUserInfoForLogging(user);
    const metadata = getRequestMetadata(ctx);
    logActivityBackground({
      databases,
      action: ActivityAction.CREATE,
      entityType: ActivityEntityType.TASK,
      entityId: task.$id,
      workspaceId,
      projectId: projectId || undefined,
      userId: userInfo.userId,
      username: userInfo.username,
      userEmail: userInfo.userEmail,
      changes: { new: task },
      metadata,
    });

    return ctx.json({ data: task });
  })
  .patch('/:taskId', sessionMiddleware, zValidator('json', createTaskSchema.partial()), async (ctx) => {
    const user = ctx.get('user');
    const databases = ctx.get('databases');

    const { name, status, description, projectId, dueDate, assigneeIds } = ctx.req.valid('json');
    const { taskId } = ctx.req.param();

    const existingTask = await databases.getDocument<Task>(DATABASE_ID, TASKS_ID, taskId);

    const member = await getMember({
      databases,
      workspaceId: existingTask.workspaceId,
      userId: user.$id,
    });

    if (!member) {
      return ctx.json({ error: 'Unauthorized.' }, 401);
    }

    // Validate: If moving to IN_REVIEW or DONE, require a comment
    if (
      (status === TaskStatus.IN_REVIEW && existingTask.status !== TaskStatus.IN_REVIEW) ||
      (status === TaskStatus.DONE && existingTask.status !== TaskStatus.DONE)
    ) {
      // Get comments by this user on this task
      const userComments = await databases.listDocuments<Comment>(DATABASE_ID, COMMENTS_ID, [
        Query.equal('taskId', taskId),
        Query.equal('authorId', user.$id),
      ]);

      if (userComments.documents.length === 0) {
        const statusName = status === TaskStatus.IN_REVIEW ? 'In Review' : 'Done';
        return ctx.json(
          {
            error: `Please add a comment before moving task to ${statusName}.`,
          },
          400,
        );
      }
    }

    const updateData: Partial<Task> = {
      name,
      status,
      projectId,
      dueDate: dueDate instanceof Date ? dueDate.toISOString() : dueDate,
      description,
    };

    if (assigneeIds !== undefined) {
      updateData.assigneeIds = assigneeIds;
    }

    const task = await databases.updateDocument(DATABASE_ID, TASKS_ID, taskId, updateData);

    // Send email notifications and log activity in background (non-blocking)
    const workspace = await databases.getDocument<Workspace>(DATABASE_ID, WORKSPACES_ID, existingTask.workspaceId);
    const project = existingTask.projectId ? await databases.getDocument<Project>(DATABASE_ID, PROJECTS_ID, existingTask.projectId) : null;
    const notificationService = new NotificationService(databases);

    // Send email notifications for status changes
    if (status && existingTask.status !== status) {
      const allAssigneeIds = Array.from(new Set([...(existingTask.assigneeIds || []), ...(task.assigneeIds || [])]));
      if (allAssigneeIds.length > 0) {
        notificationService.notifyTaskStatusChanged(
          task as Task,
          workspace.name,
          project?.name || 'No Project',
          existingTask.status,
          status,
          user.$id,
          allAssigneeIds
        );
      }
    }

    // Send email notifications for new assignees
    if (assigneeIds !== undefined) {
      const existingAssigneeIds = new Set(existingTask.assigneeIds || []);
      const newAssigneeIds = assigneeIds.filter((id) => !existingAssigneeIds.has(id));

      if (newAssigneeIds.length > 0) {
        notificationService.notifyTaskAssigned(
          task as Task,
          workspace.name,
          project?.name || 'No Project',
          user.$id,
          newAssigneeIds
        );
      }
    }

    // Log activity in background - only log changed fields
    const changedFields = getChangedFields(existingTask, task);
    if (Object.keys(changedFields).length > 0) {
      const userInfo = getUserInfoForLogging(user);
      // Build old values object with only changed fields
      const oldValues: Record<string, unknown> = {};
      for (const key in changedFields) {
        oldValues[key] = existingTask[key as keyof Task];
      }

      const metadata = getRequestMetadata(ctx);
      logActivityBackground({
        databases,
        action: ActivityAction.UPDATE,
        entityType: ActivityEntityType.TASK,
        entityId: task.$id,
        workspaceId: existingTask.workspaceId,
        projectId: existingTask.projectId || undefined,
        userId: userInfo.userId,
        username: userInfo.username,
        userEmail: userInfo.userEmail,
        changes: {
          old: oldValues,
          new: changedFields,
        },
        metadata,
      });
    }

    return ctx.json({ data: task });
  })
  .post(
    '/bulk-update',
    sessionMiddleware,
    zValidator(
      'json',
      z.object({
        tasks: z.array(
          z.object({
            $id: z.string(),
            status: z.nativeEnum(TaskStatus),
            position: z.number().int().positive().min(1000).max(1_00_000),
          }),
        ),
      }),
    ),
    async (ctx) => {
      const databases = ctx.get('databases');
      const user = ctx.get('user');
      const { tasks } = ctx.req.valid('json');

      const tasksToUpdate = await databases.listDocuments<Task>(DATABASE_ID, TASKS_ID, [
        Query.contains(
          '$id',
          tasks.map((task) => task.$id),
        ),
      ]);

      const workspaceIds = new Set(tasksToUpdate.documents.map((task) => task.workspaceId));

      if (workspaceIds.size !== 1) {
        return ctx.json({ error: 'All tasks must belong to the same workspace.' }, 401);
      }

      const workspaceId = workspaceIds.values().next().value!;

      const member = await getMember({
        databases,
        workspaceId,
        userId: user.$id,
      });

      if (!member) {
        return ctx.json({ error: 'Unauthorized.' }, 401);
      }

      // Validate: Check if moving any task to IN_REVIEW or DONE requires a comment
      for (const taskUpdate of tasks) {
        const existingTask = tasksToUpdate.documents.find((t: Task) => t.$id === taskUpdate.$id);
        if (!existingTask) continue;

        // If moving to IN_REVIEW or DONE, validate comment requirement
        if (
          (taskUpdate.status === TaskStatus.IN_REVIEW && existingTask.status !== TaskStatus.IN_REVIEW) ||
          (taskUpdate.status === TaskStatus.DONE && existingTask.status !== TaskStatus.DONE)
        ) {
          // Get comments by this user on this task
          const userComments = await databases.listDocuments<Comment>(DATABASE_ID, COMMENTS_ID, [
            Query.equal('taskId', existingTask.$id),
            Query.equal('authorId', user.$id),
          ]);

          if (userComments.documents.length === 0) {
            const statusName = taskUpdate.status === TaskStatus.IN_REVIEW ? 'In Review' : 'Done';
            return ctx.json(
              {
                error: `Please add a comment before moving task "${existingTask.name}" to ${statusName}.`,
              },
              400,
            );
          }
        }
      }

      const updatedTasks = await Promise.all(
        tasks.map(async (task) => {
          const { $id, status, position } = task;

          return databases.updateDocument<Task>(DATABASE_ID, TASKS_ID, $id, { status, position });
        }),
      );

      return ctx.json({ data: { updatedTasks, workspaceId } });
    },
  )
  .delete('/:taskId', sessionMiddleware, async (ctx) => {
    const user = ctx.get('user');
    const databases = ctx.get('databases');

    const { taskId } = ctx.req.param();

    const task = await databases.getDocument<Task>(DATABASE_ID, TASKS_ID, taskId);

    const member = await getMember({
      databases,
      workspaceId: task.workspaceId,
      userId: user.$id,
    });

    if (!member) {
      return ctx.json({ error: 'Unauthorized.' }, 401);
    }

    await databases.deleteDocument(DATABASE_ID, TASKS_ID, taskId);

    // Log activity
    const userInfo = getUserInfoForLogging(user);
    const metadata = getRequestMetadata(ctx);
    logActivityBackground({
      databases,
      action: ActivityAction.DELETE,
      entityType: ActivityEntityType.TASK,
      entityId: task.$id,
      workspaceId: task.workspaceId,
      projectId: task.projectId || undefined,
      userId: userInfo.userId,
      username: userInfo.username,
      userEmail: userInfo.userEmail,
      changes: { old: task },
      metadata,
    });

    return ctx.json({ data: task });
  })
  .post('/validate', sessionMiddleware, zValidator('json', validateTaskSchema), async (ctx) => {
    const { name, description } = ctx.req.valid('json');

    try {
      const validationService = createTaskValidationService();
      const result = await validationService.validateTask({ name, description });

      return ctx.json({ data: result });
    } catch (error) {
      console.error('[validateTaskHandler] Error:', error);

      return ctx.json(
        {
          error: 'Failed to validate task. Please try again.',
        },
        500,
      );
    }
  });

app.route('/:taskId/comments', commentsRoute);

export default app;
