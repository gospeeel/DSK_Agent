import { computed, reactive } from 'vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { backendApi } from '@/shared/api/backend-api'
import type { ApiUser } from '@/shared/api/backend-contracts'

type StaffRole = Extract<ApiUser['role'], 'manager' | 'supervisor'>

export function useStaffManagement() {
  const queryClient = useQueryClient()
  const queryKey = ['backend', 'staff', 'team'] as const
  const staff = useQuery({ queryKey, queryFn: backendApi.users })
  const form = reactive({ name: '', email: '', password: '', role: 'manager' as StaffRole })
  const employees = computed(() =>
    (staff.data.value ?? []).filter(
      (user): user is ApiUser & { role: StaffRole } =>
        user.role === 'manager' || user.role === 'supervisor',
    ),
  )
  const create = useMutation({
    mutationFn: () => {
      const name = form.name.trim()
      const email = form.email.trim().toLowerCase()
      if (!name) throw new Error('Укажите имя сотрудника')
      if (!email) throw new Error('Укажите рабочую почту')
      if (form.password.length < 8) throw new Error('Пароль должен содержать не менее 8 символов')
      return backendApi.createStaff({ name, email, password: form.password, role: form.role })
    },
    onSuccess: async () => {
      form.name = ''
      form.email = ''
      form.password = ''
      form.role = 'manager'
      await queryClient.invalidateQueries({ queryKey })
    },
  })

  return { staff, employees, form, create }
}
