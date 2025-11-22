import { zValidator } from '@hono/zod-validator';
import { endOfMonth, startOfMonth, subMonths } from 'date-fns';
import { Hono } from 'hono';
import { ID, Models, Query } from 'node-appwrite';
import { z } from 'zod';

import { DATABASE_ID, IMAGES_BUCKET_ID, PROJECTS_ID, TASKS_ID, MEMBERS_ID, WORKSPACES_ID } from '@/config/db';
import { ActivityAction, ActivityEntityType } from '@/features/activity-logs/types';
import { getUserInfoForLogging } from '@/features/activity-logs/utils/get-user-info';
import { getChangedFields } from '@/features/activity-logs/utils/log-activity';
import { logActivityBackground } from '@/lib/activity-logs/utils/log-activity-background';
import { getRequestMetadata } from '@/features/activity-logs/utils/get-request-metadata';
import { MemberRole } from '@/features/members/types';
import { getMember } from '@/features/members/utils';
import { createProjectSchema, updateProjectSchema } from '@/features/projects/schema';
import type { Project } from '@/features/projects/types';
import { type Task, TaskStatus } from '@/features/tasks/types';
import { sessionMiddleware } from '@/lib/session-middleware';
import { NotificationService } from '@/lib/email/services/notification-service';
import type { Workspace } from '@/features/workspaces/types';

const app = new Hono()
  .post('/', sessionMiddleware, zValidator('form', createProjectSchema), async (ctx) => {
    const databases = ctx.get('databases');
    const storage = ctx.get('storage');
    const user = ctx.get('user');

    const { name, image, workspaceId, clientEmail, clientAddress, clientPhone } = ctx.req.valid('form');

    const member = await getMember({
      databases,
      workspaceId,
      userId: user.$id,
    });

    if (!member) {
      return ctx.json({ error: 'Unauthorized.' }, 401);
    }

    let uploadedImageId: string | undefined = undefined;

    if (image instanceof File) {
      // Validate file size (max 1MB)
      const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB
      if (image.size > MAX_FILE_SIZE) {
        return ctx.json({ error: 'Image size cannot exceed 1 MB.' }, 400);
      }

      const fileExt = image.name.split('.').at(-1) ?? 'png';
      const fileName = `${ID.unique()}.${fileExt}`;

      const renamedImage = new File([image], fileName, {
        type: image.type,
      });
      const file = await storage.createFile(IMAGES_BUCKET_ID, ID.unique(), renamedImage);

      uploadedImageId = file.$id;
    } else {
      uploadedImageId = image;
    }

    const project = await databases.createDocument(DATABASE_ID, PROJECTS_ID, ID.unique(), {
      name,
      imageId: uploadedImageId,
      workspaceId,
      clientEmail: clientEmail || undefined,
      clientAddress: clientAddress || undefined,
      clientPhone: clientPhone || undefined,
    });

    // Create initial task for the project
    const initialTask = await databases.createDocument(DATABASE_ID, TASKS_ID, ID.unique(), {
      name: 'Update metadata including favicon',
      status: TaskStatus.TODO,
      assigneeIds: [member.$id],
      projectId: project.$id,
      workspaceId,
      position: 1000,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      description: 'Update project metadata including favicon and other branding elements.',
    });

    // Send email notifications and log activity in background (non-blocking)
    const workspace = await databases.getDocument<Workspace>(DATABASE_ID, WORKSPACES_ID, workspaceId);
    const notificationService = new NotificationService(databases);
    notificationService.notifyProjectCreated(
      name,
      workspaceId,
      workspace.name,
      user.$id,
      user.$id // Exclude creator
    );

    const userInfo = getUserInfoForLogging(user);
    const metadata = getRequestMetadata(ctx);
    logActivityBackground({
      databases,
      action: ActivityAction.CREATE,
      entityType: ActivityEntityType.PROJECT,
      entityId: project.$id,
      workspaceId,
      userId: userInfo.userId,
      username: userInfo.username,
      userEmail: userInfo.userEmail,
      changes: { new: project },
      metadata,
    });

    return ctx.json({ data: project });
  })
  .get(
    '/',
    sessionMiddleware,
    zValidator(
      'query',
      z.object({
        workspaceId: z.string(),
      }),
    ),
    async (ctx) => {
      const user = ctx.get('user');
      const databases = ctx.get('databases');
      const storage = ctx.get('storage');

      const { workspaceId } = ctx.req.valid('query');

      const member = await getMember({
        databases,
        workspaceId,
        userId: user.$id,
      });

      if (!member) {
        return ctx.json({ error: 'Unauthorized.' }, 401);
      }

      // Admins can see all projects
      const isAdmin = member.role === MemberRole.ADMIN;

      let projects;

      if (isAdmin) {
        // Admins see all projects - fetch with pagination to get all
        let allProjects: Project[] = [];
        let projectsResponse = await databases.listDocuments<Project>(DATABASE_ID, PROJECTS_ID, [
          Query.equal('workspaceId', workspaceId),
          Query.orderDesc('$createdAt'),
          Query.limit(100), // Get up to 100 projects at a time
        ]);

        allProjects = [...projectsResponse.documents];

        // Handle pagination if there are more projects
        while (projectsResponse.documents.length === 100) {
          projectsResponse = await databases.listDocuments<Project>(DATABASE_ID, PROJECTS_ID, [
          Query.equal('workspaceId', workspaceId),
          Query.orderDesc('$createdAt'),
            Query.limit(100),
            Query.offset(allProjects.length),
          ]);
          allProjects = [...allProjects, ...projectsResponse.documents];
        }

        projects = {
          ...projectsResponse,
          documents: allProjects,
          total: allProjects.length,
        };
      } else {
        // Regular members only see projects where they have tasks
        // IMPORTANT: Query tasks directly from database to bypass any project filtering
        // This ensures we get ALL tasks assigned to the user, regardless of project visibility
        // Note: We need to handle pagination as Appwrite has a default limit
        let allTasks: Task[] = [];
        let tasksResponse = await databases.listDocuments<Task>(DATABASE_ID, TASKS_ID, [
          Query.equal('workspaceId', workspaceId),
          Query.contains('assigneeIds', member.$id),
          Query.limit(100), // Get up to 100 tasks at a time
        ]);

        allTasks = [...tasksResponse.documents];

        // Handle pagination if there are more tasks
        while (tasksResponse.documents.length === 100) {
          tasksResponse = await databases.listDocuments<Task>(DATABASE_ID, TASKS_ID, [
            Query.equal('workspaceId', workspaceId),
            Query.contains('assigneeIds', member.$id),
            Query.limit(100),
            Query.offset(allTasks.length),
          ]);
          allTasks = [...allTasks, ...tasksResponse.documents];
        }

        console.log('[Projects API] Non-admin user - member ID:', member.$id);
        console.log('[Projects API] Total tasks found:', allTasks.length);
        if (allTasks.length > 0) {
          console.log('[Projects API] Sample tasks:', allTasks.slice(0, 5).map(t => ({ id: t.$id, name: t.name, projectId: t.projectId, assigneeIds: t.assigneeIds })));
        } else {
          console.log('[Projects API] WARNING: No tasks found for member:', member.$id);
          console.log('[Projects API] This might indicate a query issue or the member has no assigned tasks');
        }

        // Get unique project IDs from tasks
        const projectIds = Array.from(new Set(allTasks.map((task) => task.projectId).filter(Boolean)));

        console.log('[Projects API] Unique project IDs from tasks:', projectIds);
        console.log('[Projects API] Project IDs count:', projectIds.length);

        // If user has no tasks, return empty result
        if (projectIds.length === 0) {
          console.log('[Projects API] No project IDs found, returning empty result');
          return ctx.json({
            data: {
              documents: [],
              total: 0,
            },
          });
        }

        // Fetch all projects in the workspace and filter by projectIds in memory
        // Appwrite doesn't support Query.in for $id, so we fetch all and filter
        // Use pagination to fetch all projects
        let allProjectsList: Project[] = [];
        let projectsResponse = await databases.listDocuments<Project>(DATABASE_ID, PROJECTS_ID, [
          Query.equal('workspaceId', workspaceId),
          Query.orderDesc('$createdAt'),
          Query.limit(100), // Get up to 100 projects at a time
        ]);

        allProjectsList = [...projectsResponse.documents];

        // Handle pagination if there are more projects
        while (projectsResponse.documents.length === 100) {
          projectsResponse = await databases.listDocuments<Project>(DATABASE_ID, PROJECTS_ID, [
          Query.equal('workspaceId', workspaceId),
          Query.orderDesc('$createdAt'),
            Query.limit(100),
            Query.offset(allProjectsList.length),
          ]);
          allProjectsList = [...allProjectsList, ...projectsResponse.documents];
        }

        console.log('[Projects API] All projects in workspace:', allProjectsList.length);
        console.log('[Projects API] All project IDs:', allProjectsList.map(p => p.$id));

        // Filter to only include projects where user has tasks
        const filteredProjects = allProjectsList.filter((project) => projectIds.includes(project.$id));

        console.log('[Projects API] Filtered projects:', filteredProjects.length);
        console.log('[Projects API] Filtered project IDs:', filteredProjects.map(p => p.$id));

        projects = {
          ...projectsResponse,
          documents: filteredProjects,
          total: filteredProjects.length,
        };
      }

      const projectsWithImages: Project[] = await Promise.all(
        projects.documents.map(async (project) => {
          let imageUrl: string | undefined = undefined;

          if (project.imageId) {
            const arrayBuffer = await storage.getFileView(IMAGES_BUCKET_ID, project.imageId);
            imageUrl = `data:image/png;base64,${Buffer.from(arrayBuffer).toString('base64')}`;
          }

          return {
            ...project,
            imageUrl,
          };
        }),
      );

      return ctx.json({
        data: {
          documents: projectsWithImages,
          total: projects.total,
        },
      });
    },
  )
  .get('/:projectId', sessionMiddleware, async (ctx) => {
    const user = ctx.get('user');
    const databases = ctx.get('databases');
    const storage = ctx.get('storage');

    const { projectId } = ctx.req.param();

    const project = await databases.getDocument<Project>(DATABASE_ID, PROJECTS_ID, projectId);

    const member = await getMember({
      databases,
      workspaceId: project.workspaceId,
      userId: user.$id,
    });

    if (!member) {
      return ctx.json(
        {
          error: 'Unauthorized.',
        },
        401,
      );
    }

    // Admins can access all projects, regular members need tasks
    const isAdmin = member.role === MemberRole.ADMIN;

    if (!isAdmin) {
      // Check if user has tasks in this project
      const tasks = await databases.listDocuments<Task>(DATABASE_ID, TASKS_ID, [
        Query.equal('projectId', projectId),
        Query.contains('assigneeIds', member.$id),
      ]);

      if (tasks.total === 0) {
        return ctx.json(
          {
            error: 'Unauthorized. You do not have access to this project.',
          },
          403,
        );
      }
    }

    let imageUrl: string | undefined = undefined;

    if (project.imageId) {
      const arrayBuffer = await storage.getFileView(IMAGES_BUCKET_ID, project.imageId);
      imageUrl = `data:image/png;base64,${Buffer.from(arrayBuffer).toString('base64')}`;
    }

    return ctx.json({
      data: {
        ...project,
        imageUrl,
      },
    });
  })
  .patch('/:projectId', sessionMiddleware, zValidator('form', updateProjectSchema), async (ctx) => {
    const databases = ctx.get('databases');
    const storage = ctx.get('storage');
    const user = ctx.get('user');

    const { projectId } = ctx.req.param();
    const { name, image, clientEmail, clientAddress, clientPhone } = ctx.req.valid('form');

    const existingProject = await databases.getDocument<Project>(DATABASE_ID, PROJECTS_ID, projectId);

    const member = await getMember({
      databases,
      workspaceId: existingProject.workspaceId,
      userId: user.$id,
    });

    if (!member) {
      return ctx.json(
        {
          error: 'Unauthorized.',
        },
        401,
      );
    }

    let uploadedImageId: string | undefined = undefined;

    if (image instanceof File) {
      // Validate file size (max 1MB)
      const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB
      if (image.size > MAX_FILE_SIZE) {
        return ctx.json({ error: 'Image size cannot exceed 1 MB.' }, 400);
      }

      const fileExt = image.name.split('.').at(-1) ?? 'png';
      const fileName = `${ID.unique()}.${fileExt}`;

      const renamedImage = new File([image], fileName, {
        type: image.type,
      });

      const file = await storage.createFile(IMAGES_BUCKET_ID, ID.unique(), renamedImage);

      // delete old project image
      if (existingProject.imageId) await storage.deleteFile(IMAGES_BUCKET_ID, existingProject.imageId);

      uploadedImageId = file.$id;
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (uploadedImageId !== undefined) updateData.imageId = uploadedImageId;
    if (clientEmail !== undefined) updateData.clientEmail = clientEmail || undefined;
    if (clientAddress !== undefined) updateData.clientAddress = clientAddress || undefined;
    if (clientPhone !== undefined) updateData.clientPhone = clientPhone || undefined;

    const project = await databases.updateDocument(DATABASE_ID, PROJECTS_ID, projectId, updateData);

    // Log activity - only log changed fields
    const changedFields = getChangedFields(existingProject, project);
    if (Object.keys(changedFields).length > 0) {
      const userInfo = getUserInfoForLogging(user);
      // Build old values object with only changed fields
      const oldValues: Record<string, unknown> = {};
      for (const key in changedFields) {
        oldValues[key] = existingProject[key as keyof Project];
      }

      const metadata = getRequestMetadata(ctx);
      logActivityBackground({
        databases,
        action: ActivityAction.UPDATE,
        entityType: ActivityEntityType.PROJECT,
        entityId: project.$id,
        workspaceId: existingProject.workspaceId,
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

    return ctx.json({ data: project });
  })
  .delete('/:projectId', sessionMiddleware, async (ctx) => {
    const databases = ctx.get('databases');
    const storage = ctx.get('storage');
    const user = ctx.get('user');

    const { projectId } = ctx.req.param();

    const existingProject = await databases.getDocument<Project>(DATABASE_ID, PROJECTS_ID, projectId);

    const member = await getMember({
      databases,
      workspaceId: existingProject.workspaceId,
      userId: user.$id,
    });

    if (!member) {
      return ctx.json({ error: 'Unauthorized.' }, 401);
    }

    const tasks = await databases.listDocuments<Task>(DATABASE_ID, TASKS_ID, [Query.equal('projectId', projectId)]);

    // delete tasks
    for (const task of tasks.documents) {
      await databases.deleteDocument(DATABASE_ID, TASKS_ID, task.$id);
    }

    if (existingProject.imageId) await storage.deleteFile(IMAGES_BUCKET_ID, existingProject.imageId);

    await databases.deleteDocument(DATABASE_ID, PROJECTS_ID, projectId);

    // Log activity
    const userInfo = getUserInfoForLogging(user);
    const metadata = getRequestMetadata(ctx);
    logActivityBackground({
      databases,
      action: ActivityAction.DELETE,
      entityType: ActivityEntityType.PROJECT,
      entityId: existingProject.$id,
      workspaceId: existingProject.workspaceId,
      userId: userInfo.userId,
      username: userInfo.username,
      userEmail: userInfo.userEmail,
      changes: { old: existingProject },
      metadata,
    });

    return ctx.json({ data: { $id: existingProject.$id, workspaceId: existingProject.workspaceId } });
  })
  .get('/:projectId/analytics', sessionMiddleware, async (ctx) => {
    const databases = ctx.get('databases');
    const user = ctx.get('user');
    const { projectId } = ctx.req.param();

    const project = await databases.getDocument<Project>(DATABASE_ID, PROJECTS_ID, projectId);

    const member = await getMember({
      databases,
      workspaceId: project.workspaceId,
      userId: user.$id,
    });

    if (!member) {
      return ctx.json({ error: 'Unauthorized.' }, 401);
    }

    // Admins can access all projects, regular members need tasks
    const isAdmin = member.role === MemberRole.ADMIN;

    if (!isAdmin) {
      // Check if user has tasks in this project
      const userTasks = await databases.listDocuments<Task>(DATABASE_ID, TASKS_ID, [
        Query.equal('projectId', projectId),
        Query.contains('assigneeIds', member.$id),
      ]);

      if (userTasks.total === 0) {
        return ctx.json(
          {
            error: 'Unauthorized. You do not have access to this project.',
          },
          403,
        );
      }
    }

    const now = new Date();
    const thisMonthStart = startOfMonth(now);
    const thisMonthEnd = endOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));

    const thisMonthTasks = await databases.listDocuments<Task>(DATABASE_ID, TASKS_ID, [
      Query.equal('projectId', projectId),
      Query.greaterThanEqual('$createdAt', thisMonthStart.toISOString()),
      Query.lessThanEqual('$createdAt', thisMonthEnd.toISOString()),
    ]);

    const lastMonthTasks = await databases.listDocuments<Task>(DATABASE_ID, TASKS_ID, [
      Query.equal('projectId', projectId),
      Query.greaterThanEqual('$createdAt', lastMonthStart.toISOString()),
      Query.lessThanEqual('$createdAt', lastMonthEnd.toISOString()),
    ]);

    const taskCount = thisMonthTasks.total;
    const taskDifference = taskCount - lastMonthTasks.total;

    const thisMonthAssignedTasks = await databases.listDocuments<Task>(DATABASE_ID, TASKS_ID, [
      Query.equal('projectId', projectId),
      Query.contains('assigneeIds', member.$id),
      Query.greaterThanEqual('$createdAt', thisMonthStart.toISOString()),
      Query.lessThanEqual('$createdAt', thisMonthEnd.toISOString()),
    ]);

    const lastMonthAssignedTasks = await databases.listDocuments<Task>(DATABASE_ID, TASKS_ID, [
      Query.equal('projectId', projectId),
      Query.contains('assigneeIds', member.$id),
      Query.greaterThanEqual('$createdAt', lastMonthStart.toISOString()),
      Query.lessThanEqual('$createdAt', lastMonthEnd.toISOString()),
    ]);

    const assignedTaskCount = thisMonthAssignedTasks.total;
    const assignedTaskDifference = assignedTaskCount - lastMonthAssignedTasks.total;

    const thisMonthIncompleteTasks = await databases.listDocuments<Task>(DATABASE_ID, TASKS_ID, [
      Query.equal('projectId', projectId),
      Query.notEqual('status', TaskStatus.DONE),
      Query.greaterThanEqual('$createdAt', thisMonthStart.toISOString()),
      Query.lessThanEqual('$createdAt', thisMonthEnd.toISOString()),
    ]);

    const lastMonthIncompleteTasks = await databases.listDocuments<Task>(DATABASE_ID, TASKS_ID, [
      Query.equal('projectId', projectId),
      Query.notEqual('status', TaskStatus.DONE),
      Query.greaterThanEqual('$createdAt', lastMonthStart.toISOString()),
      Query.lessThanEqual('$createdAt', lastMonthEnd.toISOString()),
    ]);

    const incompleteTaskCount = thisMonthIncompleteTasks.total;
    const incompleteTaskDifference = incompleteTaskCount - lastMonthIncompleteTasks.total;

    const thisMonthCompletedTasks = await databases.listDocuments<Task>(DATABASE_ID, TASKS_ID, [
      Query.equal('projectId', projectId),
      Query.equal('status', TaskStatus.DONE),
      Query.greaterThanEqual('$createdAt', thisMonthStart.toISOString()),
      Query.lessThanEqual('$createdAt', thisMonthEnd.toISOString()),
    ]);

    const lastMonthCompletedTasks = await databases.listDocuments<Task>(DATABASE_ID, TASKS_ID, [
      Query.equal('projectId', projectId),
      Query.notEqual('status', TaskStatus.DONE),
      Query.greaterThanEqual('$createdAt', lastMonthStart.toISOString()),
      Query.lessThanEqual('$createdAt', lastMonthEnd.toISOString()),
    ]);

    const completedTaskCount = thisMonthCompletedTasks.total;
    const completedTaskDifference = completedTaskCount - lastMonthCompletedTasks.total;

    const thisMonthOverdueTasks = await databases.listDocuments<Task>(DATABASE_ID, TASKS_ID, [
      Query.equal('projectId', projectId),
      Query.notEqual('status', TaskStatus.DONE),
      Query.lessThan('dueDate', now.toISOString()),
      Query.greaterThanEqual('$createdAt', thisMonthStart.toISOString()),
      Query.lessThanEqual('$createdAt', thisMonthEnd.toISOString()),
    ]);

    const lastMonthOverdueTasks = await databases.listDocuments<Task>(DATABASE_ID, TASKS_ID, [
      Query.equal('projectId', projectId),
      Query.notEqual('status', TaskStatus.DONE),
      Query.lessThan('dueDate', now.toISOString()),
      Query.greaterThanEqual('$createdAt', lastMonthStart.toISOString()),
      Query.lessThanEqual('$createdAt', lastMonthEnd.toISOString()),
    ]);

    const overdueTaskCount = thisMonthOverdueTasks.total;
    const overdueTaskDifference = overdueTaskCount - lastMonthOverdueTasks.total;

    return ctx.json({
      data: {
        taskCount,
        taskDifference,
        assignedTaskCount,
        assignedTaskDifference,
        completedTaskCount,
        completedTaskDifference,
        incompleteTaskCount,
        incompleteTaskDifference,
        overdueTaskCount,
        overdueTaskDifference,
      },
    });
  });

export default app;
