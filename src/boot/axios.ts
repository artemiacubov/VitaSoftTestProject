import { Axios } from 'axios-observable'
import { connectApiInterceptor } from '@/boot/axiosInterceptors'

const root = import.meta.env.VITE_API_BASE_URL ?? ''

/** Авторизация — …/FrontTestingService-auth (методы возвращают Observable) */
export const auth$ = Axios.create({ baseURL: `${root}/FrontTestingService-auth` })

/** Основное API — …/FrontTestingService-back */
export const api$ = Axios.create({ baseURL: `${root}/FrontTestingService-back` })

connectApiInterceptor(api$)

