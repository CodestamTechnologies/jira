import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { deleteCookie, setCookie } from 'hono/cookie';
import { ID } from 'node-appwrite';
import { z } from 'zod';

import { IMAGES_BUCKET_ID } from '@/config/db';
import { getCachedImageDataUrl } from '@/lib/cache/image-cache';
import { AUTH_COOKIE } from '@/features/auth/constants';
import { signInFormSchema, signUpFormSchema, updateProfileSchema } from '@/features/auth/schema';
import { createAdminClient } from '@/lib/appwrite';
import { sessionMiddleware } from '@/lib/session-middleware';

const app = new Hono()
  .get(
    '/',
    zValidator(
      'query',
      z.object({
        userId: z.string().trim().min(1),
        secret: z.string().trim().min(1),
      }),
    ),
    async (ctx) => {
      const { userId, secret } = ctx.req.valid('query');

      const { account } = await createAdminClient();
      const session = await account.createSession(userId, secret);

      setCookie(ctx, AUTH_COOKIE, session.secret, {
        path: '/',
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 30,
      });

      return ctx.redirect(process.env.NEXT_PUBLIC_APP_BASE_URL);
    },
  )
  .get('/current', sessionMiddleware, async (ctx) => {
    const user = ctx.get('user');
    const storage = ctx.get('storage');

    // Get image URL if exists
    let imageUrl: string | undefined = undefined;
    const imageId = (user.prefs as { imageId?: string })?.imageId;
    if (imageId) {
      // Use cached image fetching to reduce storage API calls
      imageUrl = await getCachedImageDataUrl(storage, IMAGES_BUCKET_ID, imageId);
    }

    return ctx.json({
      data: {
        ...user,
        imageUrl,
      },
    });
  })
  .post('/login', zValidator('json', signInFormSchema), async (ctx) => {
    const { email, password } = ctx.req.valid('json');

    const { account } = await createAdminClient();

    const session = await account.createEmailPasswordSession(email, password);

    setCookie(ctx, AUTH_COOKIE, session.secret, {
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 30,
    });

    return ctx.json({ success: true });
  })
  .post('/register', zValidator('json', signUpFormSchema), async (ctx) => {
    const { name, email, password } = ctx.req.valid('json');

    const { account } = await createAdminClient();

    await account.create(ID.unique(), email, password, name);

    const session = await account.createEmailPasswordSession(email, password);

    setCookie(ctx, AUTH_COOKIE, session.secret, {
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 30,
    });

    return ctx.json({ success: true });
  })
  .post('/logout', sessionMiddleware, async (ctx) => {
    const account = ctx.get('account');

    deleteCookie(ctx, AUTH_COOKIE);
    await account.deleteSession('current');

    return ctx.json({ success: true });
  })
  .patch('/profile', sessionMiddleware, zValidator('form', updateProfileSchema), async (ctx) => {
    const account = ctx.get('account');
    const storage = ctx.get('storage');
    const user = ctx.get('user');

    const { name, image } = ctx.req.valid('form');

    let uploadedImageId: string | undefined = undefined;

    // Handle image upload
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

      // Delete old user image if exists
      const currentImageId = (user.prefs as { imageId?: string })?.imageId;
      if (currentImageId) {
        try {
          await storage.deleteFile(IMAGES_BUCKET_ID, currentImageId);
        } catch (error) {
          // Ignore error if file doesn't exist
        }
      }

      uploadedImageId = file.$id;
    }

    // Update user name if provided
    if (name !== undefined) {
      await account.updateName(name);
    }

    // Update user prefs with imageId if provided
    if (uploadedImageId !== undefined) {
      const currentPrefs = (user.prefs as Record<string, unknown>) || {};
      await account.updatePrefs({
        ...currentPrefs,
        imageId: uploadedImageId,
      });
    }

    // Get updated user
    const updatedUser = await account.get();

    // Get image URL if exists
    let imageUrl: string | undefined = undefined;
    const imageId = (updatedUser.prefs as { imageId?: string })?.imageId;
    if (imageId) {
      try {
        // Use cached image fetching to reduce storage API calls
        imageUrl = await getCachedImageDataUrl(storage, IMAGES_BUCKET_ID, imageId);
      } catch (error) {
        // Ignore error if file doesn't exist
      }
    }

    return ctx.json({
      data: {
        ...updatedUser,
        imageUrl,
      },
    });
  });

export default app;
