import { ref, onUnmounted } from 'vue'
import { getUsers } from '@/service-api/api'
import type { IUsers } from '@/type/api.type'
import { Subscription } from 'rxjs'

// Глобальное состояние вне компонента
const users = ref<IUsers[]>([])
const loading = ref(false)
const error = ref('')
let subscription: Subscription | null = null

export const useUsers = () => {
    const loadUsers = () => {
        loading.value = true
        if (subscription) subscription.unsubscribe()

        subscription = getUsers().subscribe({
            next: (data) => {
                users.value = Array.isArray(data) ? data : [data]
                loading.value = false
            },
            error: (err) => {
                error.value = err.message || 'Ошибка загрузки'
                loading.value = false
            }
        })
    }

    const refreshUsers = () => {
        loadUsers()
    }

    return {
        users,
        loading,
        error,
        refreshUsers,
        loadUsers
    }
}