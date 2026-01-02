export const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
export const MEMBERS_ID = process.env.NEXT_PUBLIC_APPWRITE_MEMBERS_ID!;
export const PROJECTS_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECTS_ID!;
export const TASKS_ID = process.env.NEXT_PUBLIC_APPWRITE_TASKS_ID!;
export const WORKSPACES_ID = process.env.NEXT_PUBLIC_APPWRITE_WORKSPACES_ID!;
export const COMMENTS_ID = process.env.NEXT_PUBLIC_APPWRITE_COMMENTS_ID!;
export const ATTENDANCE_ID = process.env.NEXT_PUBLIC_APPWRITE_ATTENDANCE_ID!;
export const INVOICES_ID = process.env.NEXT_PUBLIC_APPWRITE_INVOICES_ID || '';
export const ACTIVITY_LOGS_ID = process.env.NEXT_PUBLIC_APPWRITE_ACTIVITY_LOGS_ID || '';
export const PDF_TEMPLATES_ID = process.env.NEXT_PUBLIC_APPWRITE_PDF_TEMPLATES_ID || '';
export const LEADS_ID = process.env.NEXT_PUBLIC_APPWRITE_LEADS_ID || '';
export const EXPENSES_ID = process.env.NEXT_PUBLIC_APPWRITE_EXPENSES_ID || '';

// Validate critical IDs
if (!INVOICES_ID) {
  console.error('NEXT_PUBLIC_APPWRITE_INVOICES_ID is not set in environment variables');
}
if (!LEADS_ID) {
  console.error('NEXT_PUBLIC_APPWRITE_LEADS_ID is not set in environment variables');
}
if (!EXPENSES_ID) {
  console.error('NEXT_PUBLIC_APPWRITE_EXPENSES_ID is not set in environment variables');
}

export const IMAGES_BUCKET_ID = process.env.NEXT_PUBLIC_APPWRITE_IMAGES_BUCKET_ID!;
