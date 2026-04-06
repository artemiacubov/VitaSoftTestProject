import { ref } from 'vue'
import { getUsers } from '@/service-api/api'
import type { IUsers } from '@/type/api.type'
import { firstValueFrom } from 'rxjs'

const users = ref<IUsers[]>([])
const loading = ref(false)
const error = ref('')
let lastUsersCount = 0

export const useUsers = () => {
    const loadUsers = async () => {
        loading.value = true

        try {
            const data = await firstValueFrom(getUsers())

            if (data && Array.isArray(data)) {
                users.value = data
            } else if (data && !Array.isArray(data)) {
                users.value = [data]
            } else {
                users.value = []
            }

            if (lastUsersCount !== 0 && lastUsersCount !== users.value.length) {
                console.log('🔄 Количество пользователей изменилось:', lastUsersCount, '->', users.value.length)
            }
            lastUsersCount = users.value.length

        } catch (err: any) {
            error.value = err.message || 'Ошибка загрузки'
        } finally {
            loading.value = false
        }
    }

    const refreshUsers = () => {
        return loadUsers()
    }

    return {
        users,
        loading,
        error,
        refreshUsers,
        loadUsers
    }
}