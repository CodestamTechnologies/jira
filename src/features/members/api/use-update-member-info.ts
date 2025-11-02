import { useMutation, useQueryClient } from '@tanstack/react-query'

import { client } from '@/lib/hono'

type UpdateMemberInfoRequest = {
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

export const useUpdateMemberInfo = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ memberId, data }: { memberId: string; data: UpdateMemberInfoRequest }) => {
      const response = await client.api.members[':memberId'].info.$patch({
        param: { memberId },
        json: data,
      })

      if (!response.ok) {
        const error = await response.json() as { error?: string }
        throw new Error(error.error || 'Failed to update member info')
      }

      const result = await response.json()
      return result.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['member-detail', variables.memberId] })
      queryClient.invalidateQueries({ queryKey: ['members'] })
    },
  })
}
