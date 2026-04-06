<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { loginRequest } from '@/service-api/api-auth.ts'
import { setToken } from '@/service/auth'
import { Subscription } from 'rxjs'

const router = useRouter()

const username = ref('')
const password = ref('')
const loading = ref(false)
const errorMessage = ref('')

let subscription: Subscription | null = null

const submit = () => {
  if (!username.value || !password.value) {
    errorMessage.value = 'Пожалуйста, заполните все поля'
    return
  }

  loading.value = true
  errorMessage.value = ''

  if (subscription) {
    subscription.unsubscribe()
  }

  subscription = loginRequest(username.value, password.value).subscribe({
    next: (response) => {
      if (response?.data && typeof response.data === 'object') {
        const keys = Object.keys(response.data)
        if (keys.length > 0) {
          const firstKey = keys[0]!
          const token = response.data[firstKey]

          if (token) {
            setToken(token)
            router.push({ name: 'Home' })
          } else {
            errorMessage.value = 'Токен не получен'
          }
        } else {
          errorMessage.value = 'Пустой ответ от сервера'
        }
      } else {
        errorMessage.value = 'Неверный формат ответа от сервера'
      }
      loading.value = false
    },
    error: (error: any) => {
      errorMessage.value = error?.response?.data?.message || 'Ошибка входа'
      loading.value = false
    }
  })
}
</script>

<template>
  <div class="login-container">
    <form @submit.prevent="submit" class="login-form">
      <h2>Вход в систему</h2>

      <div class="form-group">
        <label for="username">Логин</label>
        <input
            id="username"
            v-model="username"
            type="text"
            placeholder="Введите ваш логин"
            required
            :disabled="loading"
        />
      </div>

      <div class="form-group">
        <label for="password">Пароль</label>
        <input
            id="password"
            v-model="password"
            type="password"
            placeholder="Введите ваш пароль"
            required
            :disabled="loading"
        />
      </div>

      <button type="submit" :disabled="loading">
        {{ loading ? 'Вход...' : 'Войти' }}
      </button>

      <div v-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>
    </form>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Commissioner:wght@300;400;500;600;700;800&display=swap');

.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  font-family: 'Commissioner', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.login-form {
  background: white;
  padding: 2.5rem;
  border-radius: 20px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 420px;
  transition: all 0.3s ease;
}

.login-form h2 {
  margin-bottom: 2rem;
  text-align: center;
  color: #333;
  font-size: 1.8em;
  font-weight: 600;
  letter-spacing: -0.3px;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #555;
  font-size: 0.9em;
}

.form-group input {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  font-size: 1rem;
  font-family: 'Commissioner', sans-serif;
  transition: all 0.3s ease;
  background: white;
}

.form-group input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-group input::placeholder {
  color: #bbb;
  font-weight: 400;
}

button {
  width: 100%;
  padding: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  font-family: 'Commissioner', sans-serif;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 10px;
}

button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3);
}

button:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.error-message {
  margin-top: 1.25rem;
  padding: 12px;
  background: #ffebee;
  color: #c62828;
  border-radius: 10px;
  text-align: center;
  font-size: 0.85em;
  font-weight: 500;
  font-family: 'Commissioner', sans-serif;
}

@media (max-width: 768px) {
  .login-form {
    margin: 20px;
    padding: 1.8rem;
  }

  .login-form h2 {
    font-size: 1.5em;
    margin-bottom: 1.5rem;
  }

  .form-group input {
    padding: 10px 12px;
  }
}
</style>