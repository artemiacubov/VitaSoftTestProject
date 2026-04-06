import { useStorage } from '@vueuse/core'

const TOKEN = 'token'
const tokenLocalStorage = useStorage('vita-live-token-data', { [TOKEN]: '' })

export const getToken = (): string | undefined => tokenLocalStorage.value[TOKEN]

export const isAuthenticated = (): boolean => !!getToken()

export const setToken = (token: string): void => {
  tokenLocalStorage.value[TOKEN] = token
}

export const removeToken = (): void => {
  tokenLocalStorage.value[TOKEN] = ''
}
