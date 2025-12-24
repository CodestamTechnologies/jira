export interface PaymentLinkRequest {
  amount: number
  currency?: string
  description: string
  customer?: {
    name: string
    email: string
    contact?: string
  }
  notes?: Record<string, string>
  expireBy?: number
  reminderEnable?: boolean
  callbackUrl?: string
  callbackMethod?: 'get' | 'post'
}

export interface PaymentLinkResponse {
  id: string
  shortUrl: string
  status: string
  amount: number
  currency: string
  description: string
  customer?: {
    name: string
    email: string
    contact?: string
  }
  notes?: Record<string, string>
  expireBy?: number
  reminderEnable: boolean
  createdAt: number
}



