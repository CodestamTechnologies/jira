'use server';

import { redirect } from 'next/navigation';
import { OAuthProvider } from 'node-appwrite';

import { createAdminClient } from '@/lib/appwrite';

export async function onOAuth(provider: OAuthProvider.Github | OAuthProvider.Google) {
  const { account } = await createAdminClient();

  const origin = process.env.NEXT_PUBLIC_APP_BASE_URL;
  console.log('Origin:', account);
  console.log('Redirect URL:', provider, origin);
  console.log('Redirect URL:', `${origin}/api/auth`, `${origin}/sign-in`);
  const redirectUrl = await account.createOAuth2Token(provider, `${origin}/api/auth`, `${origin}/sign-in`);
  return redirect(redirectUrl);
}
