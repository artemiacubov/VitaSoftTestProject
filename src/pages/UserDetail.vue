<script setup lang="ts">
import {ref, computed, onMounted, onUnmounted, watch} from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUsers } from '@/composables/useUsers'
import { createPost } from '@/service-api/api'
import { Subscription } from 'rxjs'
import type { IPost } from '@/type/api.type'
import { formatDate, showMessage } from '@/service/helpers.ts'
import { validateTitle, validateBriefDescription, validateFullDescription } from '@/service/validations.ts'

const route = useRoute()
const router = useRouter()
const { users, loadUsers } = useUsers()

const userId = ref<number>(0)
const loading = ref(false)
const creating = ref(false)
const message = ref('')
const messageType = ref<'success' | 'error'>('success')
const subscriptions = new Subscription()

const currentPage = ref(1)
const postsPerPage = ref(5)

const goToNoteDetail = (postId: number) => {
  router.push(`/post/${postId}`)
}

const goBack = () => {
  router.push('/')
}

const postErrors = ref({
  title: '',
  briefDescription: '',
  fullDescription: ''
})

const newPost = ref({
  title: '',
  briefDescription: '',
  fullDescription: ''
})

const validateTitleField = () => {
  const result = validateTitle(newPost.value.title)
  postErrors.value.title = result.error
  return result.isValid
}

const validateBriefDescriptionField = () => {
  const result = validateBriefDescription(newPost.value.briefDescription)
  postErrors.value.briefDescription = result.error
  return result.isValid
}

const validateFullDescriptionField = () => {
  const result = validateFullDescription(newPost.value.fullDescription)
  postErrors.value.fullDescription = result.error
  return result.isValid
}

const setUserId = () => {
  const id = route.params.userId
  if (id && !isNaN(Number(id))) {
    userId.value = Number(id)
  }
}

const currentUser = computed(() => {
  return users.value.find(u => u.id === userId.value)
})

const userPosts = computed<IPost[]>(() => {
  if (!currentUser.value?.post) return []
  return [...currentUser.value.post].sort((a, b) =>
      new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime()
  )
})

const paginatedPosts = computed(() => {
  const start = (currentPage.value - 1) * postsPerPage.value
  const end = start + postsPerPage.value
  return userPosts.value.slice(start, end)
})

const totalPages = computed(() =>
    Math.ceil(userPosts.value.length / postsPerPage.value)
)

const visiblePages = computed(() => {
  const delta = 2
  const range: number[] = []
  const start = Math.max(1, currentPage.value - delta)
  const end = Math.min(totalPages.value, currentPage.value + delta)

  for (let i = start; i <= end; i++) {
    range.push(i)
  }

  if (start > 1) {
    if (start > 2) range.unshift(-1)
    range.unshift(1)
  }

  if (end < totalPages.value) {
    if (end < totalPages.value - 1) range.push(-1)
    range.push(totalPages.value)
  }

  return range
})

const addPost = () => {
  const isTitleValid = validateTitleField()
  const isBriefValid = validateBriefDescriptionField()
  const isFullValid = validateFullDescriptionField()

  if (!isTitleValid || !isBriefValid || !isFullValid) {
    showMessage(message, messageType,'Пожалуйста, исправьте ошибки в форме', 'error')
    return
  }

  creating.value = true

  const sub = createPost(userId.value, {
    title: newPost.value.title,
    briefDescription: newPost.value.briefDescription,
    fullDescription: newPost.value.fullDescription
  }).subscribe({
    next: () => {
      showMessage(message, messageType,'Пост успешно добавлен!', 'success')
      newPost.value = {
        title: '',
        briefDescription: '',
        fullDescription: ''
      }
      loadUsers()
      currentPage.value = 1
      creating.value = false
    },
    error: (err) => {
      showMessage(message, messageType,`Ошибка: ${err.message || 'Не удалось добавить пост'}`, 'error')
      creating.value = false
    }
  })

  subscriptions.add(sub)
}

watch(() => route.params.userId, () => {
  setUserId()
  currentPage.value = 1
}, { immediate: true })

watch(users, (newUsers) => {
  if (userId.value !== 0 && !newUsers.find(u => u.id === userId.value)) {
    router.push('/')
  }
}, { deep: true })

onMounted(() => {
  setUserId()
  loadUsers()
})

onUnmounted(() => {
  subscriptions.unsubscribe()
})
</script>

<template>
  <div class="user-detail-container">
    <button class="back-btn" @click="goBack">
      🡄 К списку
    </button>

    <div v-if="currentUser" class="user-header">
      <h1>{{ currentUser.blogName || currentUser.fullName }}</h1>
      <p v-if="currentUser.fullName && currentUser.fullName !== currentUser.blogName" class="full-name">
        {{ currentUser.fullName }}
      </p>
      <p class="user-id">ID: {{ currentUser.id }}</p>
      <p class="posts-count">Всего постов: {{ currentUser.post?.length || 0 }}</p>
    </div>

    <div v-else-if="!loading && users.length > 0" class="not-found">
      <p>😕 Пользователь не найден</p>
      <button @click="goBack" class="back-home-btn">Вернуться на главную</button>
    </div>

    <div class="add-post-section">
      <h2>📝 Добавить запись</h2>
      <form @submit.prevent="addPost" class="add-post-form">
        <div class="form-group">
          <input
              v-model="newPost.title"
              type="text"
              :class="['input-field', { error: postErrors.title }]"
              placeholder="Введите заголовок"
          />
          <span v-if="postErrors.title" class="error-text">{{ postErrors.title }}</span>
          <span class="char-counter">{{ newPost.title.length }}/50</span>
        </div>

        <div class="form-group">
          <textarea
              v-model="newPost.briefDescription"
              :class="['input-field', { error: postErrors.briefDescription }]"
              rows="2"
              placeholder="Краткое описание поста"
          ></textarea>
          <span v-if="postErrors.briefDescription" class="error-text">{{ postErrors.briefDescription }}</span>
          <span class="char-counter">{{ newPost.briefDescription.length }}/100</span>
        </div>

        <div class="form-group">
          <textarea
              v-model="newPost.fullDescription"
              :class="['input-field', { error: postErrors.fullDescription }]"
              rows="4"
              placeholder="Полное содержание поста"
          ></textarea>
          <span v-if="postErrors.fullDescription" class="error-text">{{ postErrors.fullDescription }}</span>
          <span class="char-counter">{{ newPost.fullDescription.length }}/255</span>
        </div>

        <button type="submit" :disabled="creating" class="submit-btn">
          {{ creating ? 'Добавление...' : '➕ Добавить пост' }}
        </button>
      </form>
    </div>

    <div class="posts-section">
      <h2>📖 Записи блога</h2>

      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <p>Загрузка...</p>
      </div>

      <div v-else-if="userPosts.length === 0" class="empty">
        <p>😕 Пока нет ни одной записи</p>
        <p>Будьте первым, кто создаст пост!</p>
      </div>

      <div v-else class="posts-list">
        <div
            v-for="post in paginatedPosts"
            :key="post.id"
            class="post-card"
            @click="goToNoteDetail(post.id)"
        >
          <div class="post-header">
            <h3 class="post-title">{{ post.title }}</h3>
          </div>

          <p class="post-brief">{{ post.briefDescription }}</p>
          <p class="post-full">{{ post.fullDescription }}</p>

          <div class="post-footer">
            <span class="post-date">📅 {{ formatDate(post.dateTime) }}</span>
            <span class="post-comments">
              💬 {{ post.comments?.length || 0 }} комментариев
            </span>
          </div>
        </div>
      </div>

      <div v-if="totalPages > 1" class="pagination">
        <button
            @click="currentPage--"
            :disabled="currentPage === 1"
            class="page-btn"
        >
          🡄 Назад
        </button>

        <div class="page-numbers">
          <button
              v-for="page in visiblePages"
              :key="page"
              @click="currentPage = page"
              :class="['page-number', { active: page === currentPage }]"
          >
            {{ page === -1 ? '...' : page }}
          </button>
        </div>

        <button
            @click="currentPage++"
            :disabled="currentPage === totalPages"
            class="page-btn"
        >
          Вперед 🡆
        </button>
      </div>
    </div>

    <div v-if="message" :class="['message', messageType]">
      {{ message }}
    </div>
  </div>
</template>

<style scoped>
.user-detail-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  font-family: 'Commissioner', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.back-btn {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  margin-bottom: 20px;
  transition: all 0.3s ease;
  font-family: 'Commissioner', sans-serif;
  font-weight: 500;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateX(-4px);
}

.user-header {
  background: white;
  border-radius: 16px;
  padding: 30px;
  margin-bottom: 30px;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.user-header h1 {
  margin: 0 0 10px 0;
  color: #333;
  font-size: 2.5em;
}

.full-name {
  color: #666;
  font-size: 1.1em;
  margin: 5px 0;
}

.user-id, .posts-count {
  color: #999;
  font-size: 0.9em;
  margin: 5px 0;
}

.add-post-section, .posts-section {
  background: white;
  border-radius: 16px;
  padding: 30px;
  margin-bottom: 30px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.add-post-section h2, .posts-section h2 {
  margin: 0 0 20px 0;
  color: #333;
  font-size: 1.5em;
}

.add-post-form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
  position: relative;
}

.form-group label {
  font-weight: 500;
  color: #555;
}

.input-field {
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  transition: border-color 0.3s;
}

.input-field:focus {
  outline: none;
  border-color: #667eea;
}

.input-field.error {
  border-color: #f44336;
}

.error-text {
  color: #f44336;
  font-size: 12px;
}

.char-counter {
  font-size: 11px;
  color: #999;
  text-align: right;
}

.submit-btn {
  padding: 12px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  transition: all 0.3s ease;
  margin-top: 10px;
}

.submit-btn:hover:not(:disabled) {
  background: #5a67d8;
  transform: translateY(-2px);
}

.submit-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.posts-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.post-card {
  background: #f9f9f9;
  border-radius: 12px;
  padding: 20px;
  transition: all 0.3s ease;
  cursor: pointer;
}

.post-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.post-title {
  margin: 0 0 10px 0;
  color: #333;
  font-size: 1.3em;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.post-brief {
  color: #666;
  line-height: 1.5;
  margin: 10px 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.post-full {
  color: #888;
  line-height: 1.6;
  margin: 10px 0;
  padding-top: 10px;
  border-top: 1px solid #eee;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.post-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #eee;
  font-size: 0.9em;
}

.post-date {
  color: #999;
}

.post-comments {
  color: #667eea;
  font-weight: 500;
}

.loading, .empty, .not-found {
  background: white;
  border-radius: 16px;
  padding: 60px;
  text-align: center;
}

.spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-top: 30px;
  padding: 20px;
  background: #f9f9f9;
  border-radius: 12px;
}

.page-btn {
  padding: 8px 20px;
  background-color: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
}

.page-btn:hover:not(:disabled) {
  background-color: #5a67d8;
  transform: translateY(-1px);
}

.page-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.page-numbers {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.page-number {
  min-width: 36px;
  height: 36px;
  padding: 0 8px;
  background-color: #f7f7f7;
  color: #666;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
}

.page-number:hover:not(.active) {
  background-color: #667eea;
  color: white;
  border-color: #667eea;
}

.page-number.active {
  background-color: #667eea;
  color: white;
  border-color: #667eea;
  cursor: default;
}

.message {
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 14px;
  animation: slideIn 0.3s ease;
  z-index: 1000;
}

.message.success {
  background: #4caf50;
  color: white;
}

.message.error {
  background: #f44336;
  color: white;
}

.back-home-btn {
  margin-top: 20px;
  padding: 10px 20px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(100px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@media (max-width: 768px) {
  .user-detail-container {
    padding: 15px;
  }

  .user-header h1 {
    font-size: 1.8em;
  }

  .add-post-section, .posts-section {
    padding: 20px;
  }

  .pagination {
    flex-wrap: wrap;
  }

  .page-numbers {
    order: 3;
    width: 100%;
    justify-content: center;
  }

  .post-title {
    -webkit-line-clamp: 2;
  }

  .post-brief {
    -webkit-line-clamp: 2;
  }

  .post-full {
    -webkit-line-clamp: 2;
  }
}

@media (max-width: 410px) {
  .post-footer {
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }
}

</style>
