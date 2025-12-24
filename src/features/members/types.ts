import { Models } from 'node-appwrite'

export enum MemberRole {
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
}

export type Member = Models.Document & {
  workspaceId: string
  userId: string
  name: string
  email: string
  role: MemberRole
  isActive?: boolean // Defaults to true, false for inactive/former members
  hasLeadsAccess?: boolean // Permission to access leads feature
  // Additional information fields
  position?: string
  address?: string
  aadhar?: string
  basicSalary?: number
  hra?: number
  transportAllowance?: number
  medicalAllowance?: number
  specialAllowance?: number
  providentFund?: number
  professionalTax?: number
  incomeTax?: number
  accountNumber?: string
  ifsc?: string
  bankName?: string
  phoneNumber?: string
  dateOfJoining?: string
}
