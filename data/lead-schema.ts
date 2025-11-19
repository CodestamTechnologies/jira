import { z } from "zod"

export const LeadStatus = {
    NEW: 'new',
    CONTACTED: 'contacted',
    QUALIFIED: 'qualified',
    PROPOSAL: 'proposal',
    NEGOTIATION: 'negotiation',
    CLOSED_WON: 'closed_won',
    CLOSED_LOST: 'closed_lost'
} as const

export const LeadPriority = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    URGENT: 'urgent'
} as const

export const LeadSource = {
    WEBSITE: 'website',
    REFERRAL: 'referral',
    SOCIAL_MEDIA: 'social_media',
    EMAIL: 'email',
    PHONE: 'phone',
    OTHER: 'other'
} as const

export type LeadStatusType = typeof LeadStatus[keyof typeof LeadStatus]
export type LeadPriorityType = typeof LeadPriority[keyof typeof LeadPriority]
export type LeadSourceType = typeof LeadSource[keyof typeof LeadSource]

// Comment schema
export const commentSchema = z.object({
    id: z.string(),
    content: z.string().min(1, "Comment cannot be empty"),
    authorId: z.string(),
    authorName: z.string(),
    authorEmail: z.string().email(),
    createdAt: z.string(),
    updatedAt: z.string().optional(),
})

// Lead schema
export const leadSchema = z.object({
    id: z.string(),
    workspaceId: z.string(),
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email format").optional(),
    phone: z.string().optional(),
    company: z.string().optional(),
    website: z.string().url().optional().or(z.literal("")),
    source: z.enum([LeadSource.WEBSITE, LeadSource.REFERRAL, LeadSource.SOCIAL_MEDIA, LeadSource.EMAIL, LeadSource.PHONE, LeadSource.OTHER]).default(LeadSource.OTHER),
    status: z.enum([LeadStatus.NEW, LeadStatus.CONTACTED, LeadStatus.QUALIFIED, LeadStatus.PROPOSAL, LeadStatus.NEGOTIATION, LeadStatus.CLOSED_WON, LeadStatus.CLOSED_LOST]).default(LeadStatus.NEW),
    priority: z.enum([LeadPriority.LOW, LeadPriority.MEDIUM, LeadPriority.HIGH, LeadPriority.URGENT]).default(LeadPriority.MEDIUM),
    description: z.string().optional(),
    notes: z.string().optional(),
    assigneeIds: z.array(z.string()).default([]),
    assignees: z.array(z.object({
        $id: z.string(),
        name: z.string(),
        email: z.string().optional(),
    })).default([]),
    assignee: z.object({
        $id: z.string(),
        name: z.string(),
        email: z.string().optional(),
    }).optional(),
    createdBy: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
    comments: z.array(commentSchema).default([]),
})

// Create lead schema (without id and timestamps)
export const createLeadSchema = z.object({
    name: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
    email: z.string().email("Invalid email format").max(255, "Email must be less than 255 characters").optional(),
    phone: z.string().max(20, "Phone must be less than 20 characters").optional(),
    company: z.string().max(100, "Company must be less than 100 characters").optional(),
    website: z.string().url("Invalid website URL").optional().or(z.literal("")),
    source: z.enum([LeadSource.WEBSITE, LeadSource.REFERRAL, LeadSource.SOCIAL_MEDIA, LeadSource.EMAIL, LeadSource.PHONE, LeadSource.OTHER]).default(LeadSource.OTHER),
    status: z.enum([LeadStatus.NEW, LeadStatus.CONTACTED, LeadStatus.QUALIFIED, LeadStatus.PROPOSAL, LeadStatus.NEGOTIATION, LeadStatus.CLOSED_WON, LeadStatus.CLOSED_LOST]).default(LeadStatus.NEW),
    priority: z.enum([LeadPriority.LOW, LeadPriority.MEDIUM, LeadPriority.HIGH, LeadPriority.URGENT]).default(LeadPriority.MEDIUM),
    description: z.string().max(1000, "Description must be less than 1000 characters").optional(),
    notes: z.string().max(1000, "Notes must be less than 1000 characters").optional(),
    assigneeIds: z.array(z.string()).default([]),
})

// Update lead schema (all fields optional)
export const updateLeadSchema = createLeadSchema.partial()

// Create comment schema
export const createCommentSchema = z.object({
    content: z.string().min(1, "Comment cannot be empty").max(500, "Comment must be less than 500 characters"),
})

// Types
export type Lead = z.infer<typeof leadSchema>
export type CreateLeadData = z.infer<typeof createLeadSchema>
export type UpdateLeadData = z.infer<typeof updateLeadSchema>
export type Comment = z.infer<typeof commentSchema>
export type CreateCommentData = z.infer<typeof createCommentSchema>

// Validation functions
export function validateCreateLead(data: unknown) {
    return createLeadSchema.safeParse(data)
}

export function validateUpdateLead(data: unknown) {
    return updateLeadSchema.safeParse(data)
}

export function validateCreateComment(data: unknown) {
    return createCommentSchema.safeParse(data)
} 
