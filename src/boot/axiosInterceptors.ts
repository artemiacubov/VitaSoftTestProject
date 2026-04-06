import { HttpStatusCode } from 'axios'
import Axios from 'axios-observable'
import { getToken, removeToken } from '@/service/auth'

export const connectApiInterceptor: (engine: Axios) => void = (engine) => {
  engine.interceptors.request.use((config) => {
      config.headers = {
        ...config.headers,
          ...(getToken() && { Authorization: `Token ${getToken}` }),
      }
    return config
  })

  engine.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (error?.response?.status === HttpStatusCode.Unauthorized || error?.response?.status === HttpStatusCode.Forbidden) {
        removeToken()
        window.location.replace('/login')
      }
      return Promise.reject(error)
    }
  )
}
