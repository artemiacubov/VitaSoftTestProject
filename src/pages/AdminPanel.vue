<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { createUser, deleteUserById } from '@/service-api/api'
import { Subscription } from 'rxjs'
import { useUsers } from '@/composables/useUsers'
import ConfirmModal from '@/pages/modals/ConfirmModal.vue'

const router = useRouter()

const { users, refreshUsers, loadUsers } = useUsers()

const isCollapsed = ref(true)
const loading = ref(false)
const message = ref('')
const messageType = ref<'success' | 'error'>('success')
const newUser = ref({ blogName: '', fullName: '' })
const deletingIds = ref<Set<number>>(new Set())
const subscriptions = new Subscription()
const isMobile = ref(false)

const confirmModal = ref<InstanceType<typeof ConfirmModal> | null>(null)

const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768
}

const showMessage = (text: string, type: 'success' | 'error') => {
  message.value = text
  messageType.value = type
  setTimeout(() => { if (message.value === text) message.value = '' }, 3000)
}

const goToUserDetail = (userId: number) => {
  router.push(`/user/${userId}`)
  if (isMobile.value) {
    isCollapsed.value = true
  }
}

const addUser = () => {
  if (!newUser.value.blogName && !newUser.value.fullName) {
    showMessage('Заполните хотя бы одно поле', 'error')
    return
  }

  loading.value = true
  const sub = createUser(newUser.value).subscribe({
    next: () => {
      showMessage('Пользователь успешно создан', 'success')
      newUser.value = { blogName: '', fullName: '' }
      refreshUsers()
      loading.value = false
    },
    error: (err) => {
      showMessage(`Ошибка: ${err.message || 'Не удалось создать пользователя'}`, 'error')
      loading.value = false
    }
  })
  subscriptions.add(sub)
}

const deleteUser = async (id: number) => {
  const confirmed = await confirmModal.value?.open(
      'Подтверждение удаления',
      `Вы уверены, что хотите удалить пользователя с ID ${id}? Это действие нельзя отменить.`
  )

  if (!confirmed) return

  deletingIds.value.add(id)
  const sub = deleteUserById(id).subscribe({
    next: () => {
      showMessage('Пользователь успешно удалён', 'success')
      refreshUsers()
      deletingIds.value.delete(id)
    },
    error: (err) => {
      showMessage(`Ошибка: ${err.message || 'Не удалось удалить пользователя'}`, 'error')
      deletingIds.value.delete(id)
    }
  })
  subscriptions.add(sub)
}

const togglePanel = () => {
  isCollapsed.value = !isCollapsed.value
}

const handleClickOutside = (event: MouseEvent) => {
  if (isCollapsed.value) return

  const panel = document.querySelector('.admin-panel')
  const toggleBtn = document.querySelector('.toggle-btn')

  if (panel && !panel.contains(event.target as Node) &&
      toggleBtn && !toggleBtn.contains(event.target as Node)) {
    isCollapsed.value = true
  }
}

const handleResize = () => {
  checkMobile()
  if (!isCollapsed.value) {
    isCollapsed.value = true
  }
}

watch(isCollapsed, (newVal) => {
  if (!newVal) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
})

onMounted(() => {
  loadUsers()
  checkMobile()
  document.addEventListener('click', handleClickOutside)
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  subscriptions.unsubscribe()
  document.removeEventListener('click', handleClickOutside)
  window.removeEventListener('resize', handleResize)
  document.body.style.overflow = ''
})
</script>

<template>
  <div class="admin-panel-wrapper">
    <div class="admin-panel" :class="{ collapsed: isCollapsed, mobile: isMobile }">
      <button class="toggle-btn" @click.stop="togglePanel">
        <span class="toggle-icon">{{ isCollapsed ? 'A' : '✕' }}</span>
      </button>

      <div v-if="!isCollapsed" class="admin-content">
        <div class="admin-header">
          <h3>Админ</h3>
          <span class="admin-badge">панель</span>
        </div>

        <div class="section">
          <div class="section-title">
            Добавить пользователя
          </div>
          <form @submit.prevent="addUser" class="add-form">
            <input
                v-model="newUser.blogName"
                type="text"
                placeholder="Название блога"
                class="input-field"
            >
            <input
                v-model="newUser.fullName"
                type="text"
                placeholder="Полное имя"
                class="input-field"
            >
            <button type="submit" :disabled="loading" class="submit-btn">
              {{ loading ? '...' : 'Создать' }}
            </button>
          </form>
        </div>

        <div class="section">
          <div class="section-title">
            Список пользователей
          </div>
          <div class="users-list">
            <div v-if="users.length === 0" class="empty-state">
              Пока нет пользователей
            </div>
            <div
                v-for="user in users"
                :key="user.id"
                class="user-item"
                @click="goToUserDetail(user.id)"
            >
              <div class="user-info">
                <span class="user-name">{{ user.fullName }}</span>
                <span class="user-id">id: {{ user.id }}</span>
              </div>
              <button
                  @click.stop="deleteUser(user.id)"
                  class="delete-btn"
                  :disabled="deletingIds.has(user.id)"
                  title="Удалить"
              >
                {{ deletingIds.has(user.id) ? '...' : '×' }}
              </button>
            </div>
          </div>
        </div>

        <div v-if="message" :class="['message', messageType]">
          {{ message }}
        </div>
      </div>
    </div>

    <Transition name="fade">
      <div
          v-if="!isCollapsed"
          class="overlay"
          :class="{ mobile: isMobile }"
          @click="togglePanel"
      ></div>
    </Transition>

    <ConfirmModal ref="confirmModal" />
  </div>
</template>

<style scoped>
.admin-panel-wrapper {
  position: fixed;
  left: 0;
  top: 0;
  z-index: 9999;
}

.admin-panel {
  position: fixed;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(10px);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-family: 'Commissioner', -apple-system, BlinkMacSystemFont, sans-serif;
  z-index: 10000;
}

/* Десктопная версия - выезжает слева */
.admin-panel:not(.mobile) {
  left: 0;
  top: 0;
  width: 300px;
  height: 100vh;
  border-right: 1px solid rgba(0, 0, 0, 0.05);
}

.admin-panel:not(.mobile).collapsed {
  transform: translateX(-100%);
}

/* Мобильная версия - выезжает сверху */
.admin-panel.mobile {
  left: 0;
  right: 0;
  top: 0;
  width: 100%;
  max-height: 570px;
  border-radius: 0 0 20px 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.admin-panel.mobile.collapsed {
  transform: translateY(-100%);
}

/* Кнопка переключения для десктопа */
.admin-panel:not(.mobile) .toggle-btn {
  position: absolute;
  right: -54px;
  top: 16px;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: white;
  border: 1px solid rgba(0, 0, 0, 0.1);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

/* Кнопка переключения для мобильных */
.admin-panel.mobile .toggle-btn {
  position: absolute;
  right: 16px;
  top: 16px;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: white;
  border: 1px solid rgba(0, 0, 0, 0.1);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.toggle-btn:hover {
  background: #f5f5f5;
  transform: scale(1.02);
}

.toggle-icon {
  font-size: 18px;
  font-weight: 400;
  color: #333;
}

/* Контент для десктопа */
.admin-panel:not(.mobile) .admin-content {
  height: 100vh;
  overflow-y: auto;
  padding: 24px 20px;
}

/* Контент для мобильных */
.admin-panel.mobile .admin-content {
  max-height: 570px;
  overflow-y: hidden;
  padding: 36px 16px 20px 16px;
  display: flex;
  flex-direction: column;
}

.admin-content::-webkit-scrollbar {
  width: 4px;
}

.admin-content::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.admin-content::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 4px;
}

.admin-header {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 32px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.admin-header h3 {
  font-size: 22px;
  font-weight: 600;
  margin: 0;
  color: #1a1a1a;
  letter-spacing: -0.3px;
}

.admin-badge {
  font-size: 11px;
  font-weight: 500;
  color: #888;
  background: #f5f5f5;
  padding: 2px 6px;
  border-radius: 4px;
}

.section {
  margin-bottom: 32px;
}

/* Мобильные секции */
.admin-panel.mobile .section:first-of-type {
  flex-shrink: 0;
}

.admin-panel.mobile .section:last-of-type {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.section-title {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #888;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.section-title .icon {
  font-size: 14px;
}

.add-form {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-field {
  padding: 10px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 13px;
  font-family: 'Commissioner', sans-serif;
  transition: all 0.2s ease;
  background: white;
}

.input-field:focus {
  outline: none;
  border-color: #aaa;
}

.input-field::placeholder {
  color: #bbb;
  font-weight: 400;
}

.submit-btn {
  padding: 10px 12px;
  background: #1a1a1a;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  font-family: 'Commissioner', sans-serif;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 4px;
}

.submit-btn:hover:not(:disabled) {
  background: #333;
  transform: translateY(-1px);
}

.submit-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.users-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

/* Мобильный список пользователей - скроллится */
.admin-panel.mobile .users-list {
  flex: 1;
  overflow-y: auto;
  padding-right: 4px;
}

/* Кастомный скроллбар для списка пользователей на мобильных */
.admin-panel.mobile .users-list::-webkit-scrollbar {
  width: 3px;
}

.admin-panel.mobile .users-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.admin-panel.mobile .users-list::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 4px;
}

.user-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 10px;
  background: #f9f9f9;
  border-radius: 8px;
  transition: all 0.2s ease;
  cursor: pointer;
}

.user-item:hover {
  background: #f0f0f0;
}

.user-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.user-name {
  font-size: 13px;
  font-weight: 500;
  color: #1a1a1a;
}

.user-id {
  font-size: 10px;
  color: #999;
  font-family: monospace;
}

.delete-btn {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 18px;
  color: #999;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.delete-btn:hover:not(:disabled) {
  background: #fee;
  color: #e74c3c;
}

.delete-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.empty-state {
  text-align: center;
  padding: 20px;
  color: #bbb;
  font-size: 12px;
  font-weight: 400;
}

.message {
  margin-top: 20px;
  padding: 10px;
  border-radius: 8px;
  font-size: 12px;
  text-align: center;
  animation: slideUp 0.3s ease;
  font-weight: 500;
}

.message.success {
  background: #e8f5e9;
  color: #2e7d32;
}

.message.error {
  background: #ffebee;
  color: #c62828;
}

/* Оверлей для всех устройств */
.overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 9999;
}

/* Для мобильных оверлей чуть темнее */
.overlay.mobile {
  background: rgba(0, 0, 0, 0.5);
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Адаптивность для телефонов */
@media (max-width: 768px) {
  .section {
    margin-bottom: 54px;
  }

  .user-item {
    padding: 8px;
  }

  .admin-panel.mobile {
    max-height: 570px;
  }

  .admin-panel.mobile .admin-content {
    max-height: 570px;
  }
}
</style>