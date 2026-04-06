<script setup lang="ts">
import {ref, onMounted, onUnmounted, watch} from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getPostById, createComment, editPost, deletePostById, deleteCommentById } from '@/service-api/api'
import { Subscription } from 'rxjs'
import type { IPost, IComment } from '@/type/api.type'

const route = useRoute()
const router = useRouter()

const postId = ref<number>(Number(route.params.postId))
const post = ref<IPost | null>(null)
const loading = ref(false)
const submitting = ref(false)
const editing = ref(false)
const deleting = ref(false)
const deletingCommentId = ref<number | null>(null)
const message = ref('')
const messageType = ref<'success' | 'error'>('success')
const subscriptions = new Subscription()

const goToUser = () => {
  if (post.value?.userInfoId) {
    router.push(`/user/${post.value.userInfoId}`)
  }
}

// Переход назад
const goBack = () => {
  router.push('/')
}

// Форма для нового комментария
const newComment = ref<Omit<IComment, 'dateTime' | 'id'>>({
  email: '',
  textComment: '',
  userInfo: ''
})

// Форма для редактирования поста
const editForm = ref({
  title: '',
  briefDescription: '',
  fullDescription: ''
})

const commentErrors = ref({
  userInfo: '',
  email: '',
  textComment: ''
})

// Форматирование даты
const formatDate = (dateString: string) => {
  if (!dateString) return 'Дата не указана'

  const date = new Date(dateString)
  const now = new Date()
  const timezoneOffset = now.getTimezoneOffset() * 60 * 1000
  const localDate = new Date(date.getTime() + timezoneOffset)
  const localNow = new Date(now.getTime() + timezoneOffset)

  const today = new Date(localNow.getFullYear(), localNow.getMonth(), localNow.getDate())
  const postDate = new Date(localDate.getFullYear(), localDate.getMonth(), localDate.getDate())

  const diffTime = today.getTime() - postDate.getTime()
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return `Сегодня в ${localDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`
  }
  if (diffDays === 1) {
    return `Вчера в ${localDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`
  }

  return localDate.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Показать сообщение
const showMessage = (text: string, type: 'success' | 'error') => {
  message.value = text
  messageType.value = type
  setTimeout(() => {
    if (message.value === text) message.value = ''
  }, 3000)
}

// Загрузка поста
const loadPost = () => {
  loading.value = true
  const sub = getPostById(postId.value).subscribe({
    next: (data) => {
      post.value = data
      loading.value = false
    },
    error: (err) => {
      showMessage('Не удалось загрузить пост', 'error')
      loading.value = false
    }
  })
  subscriptions.add(sub)
}

const validateCommentUserInfo = () => {
  if (newComment.value.userInfo && newComment.value.userInfo.length > 50) {
    commentErrors.value.userInfo = 'Имя не должно превышать 50 символов'
    return false
  }
  commentErrors.value.userInfo = ''
  return true
}

// Валидация email
const validateCommentEmail = () => {
  if (!newComment.value.email) {
    commentErrors.value.email = 'Email обязателен'
    return false
  }
  if (newComment.value.email.length > 50) {
    commentErrors.value.email = 'Email не должен превышать 50 символов'
    return false
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(newComment.value.email)) {
    commentErrors.value.email = 'Введите корректный email'
    return false
  }
  commentErrors.value.email = ''
  return true
}

// Валидация текста комментария
const validateCommentText = () => {
  if (!newComment.value.textComment) {
    commentErrors.value.textComment = 'Текст комментария обязателен'
    return false
  }
  if (newComment.value.textComment.length > 255) {
    commentErrors.value.textComment = 'Текст комментария не должен превышать 255 символов'
    return false
  }
  commentErrors.value.textComment = ''
  return true
}

// Добавление комментария
const addComment = () => {
  const isUserInfoValid = validateCommentUserInfo()
  const isEmailValid = validateCommentEmail()
  const isTextValid = validateCommentText()

  if (!isUserInfoValid || !isEmailValid || !isTextValid) {
    showMessage('Пожалуйста, исправьте ошибки в форме', 'error')
    return
  }

  submitting.value = true

  const commentData = {
    email: newComment.value.email,
    textComment: newComment.value.textComment,
    userInfo: newComment.value.userInfo || ''
  }

  const sub = createComment(postId.value, commentData).subscribe({
    next: () => {
      showMessage('Комментарий успешно добавлен!', 'success')
      newComment.value = {
        email: '',
        textComment: '',
        userInfo: ''
      }
      loadPost()
      submitting.value = false
    },
    error: (err) => {
      showMessage(`Ошибка: ${err.message || 'Не удалось добавить комментарий'}`, 'error')
      submitting.value = false
    }
  })

  subscriptions.add(sub)
}

// Удаление комментария
const deleteComment = (commentId: number) => {
  if (!confirm('Вы уверены, что хотите удалить этот комментарий? Это действие нельзя отменить.')) return

  deletingCommentId.value = commentId
  const sub = deleteCommentById(commentId).subscribe({
    next: () => {
      showMessage('Комментарий успешно удалён!', 'success')
      loadPost() // Перезагружаем пост, чтобы обновить список комментариев
      deletingCommentId.value = null
    },
    error: (err) => {
      showMessage(`Ошибка: ${err.message || 'Не удалось удалить комментарий'}`, 'error')
      deletingCommentId.value = null
    }
  })
  subscriptions.add(sub)
}

// Открыть форму редактирования
const openEditForm = () => {
  if (post.value) {
    editForm.value = {
      title: post.value.title,
      briefDescription: post.value.briefDescription,
      fullDescription: post.value.fullDescription
    }
    editing.value = true
  }
}

// Закрыть форму редактирования
const closeEditForm = () => {
  editing.value = false
  editForm.value = {
    title: '',
    briefDescription: '',
    fullDescription: ''
  }
}

// Сохранить изменения поста
const savePostEdit = () => {
  if (!editForm.value.title || !editForm.value.briefDescription || !editForm.value.fullDescription) {
    showMessage('Заполните все поля', 'error')
    return
  }

  const sub = editPost({
    id: postId.value,
    title: editForm.value.title,
    briefDescription: editForm.value.briefDescription,
    fullDescription: editForm.value.fullDescription
  }).subscribe({
    next: () => {
      showMessage('Пост успешно обновлён!', 'success')
      closeEditForm()
      loadPost()
    },
    error: (err) => {
      showMessage(`Ошибка: ${err.message || 'Не удалось обновить пост'}`, 'error')
    }
  })

  subscriptions.add(sub)
}

// Удалить пост
const deletePost = () => {
  if (!confirm('Вы уверены, что хотите удалить этот пост? Это действие нельзя отменить.')) return

  deleting.value = true
  const sub = deletePostById(postId.value).subscribe({
    next: () => {
      showMessage('Пост успешно удалён!', 'success')
      setTimeout(() => {
        router.push('/')
      }, 1000)
    },
    error: (err) => {
      showMessage(`Ошибка: ${err.message || 'Не удалось удалить пост'}`, 'error')
      deleting.value = false
    }
  })

  subscriptions.add(sub)
}

onMounted(() => {
  loadPost()
})

onUnmounted(() => {
  subscriptions.unsubscribe()
})
</script>

<template>
  <div class="note-detail-container">
    <div class="nav-buttons">
      <button class="back-btn" @click="goBack">
        🡄 К списку
      </button>
      <button class="back-btn" @click="goToUser" v-if="post?.userInfoId">
        🡄 К пользователю
      </button>
    </div>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Загрузка...</p>
    </div>

    <div v-else-if="!post" class="not-found">
      <p>😕 Пост не найден</p>
      <button @click="goBack" class="back-home-btn">Вернуться на главную</button>
    </div>

    <div v-else class="post-section">
      <!-- Кнопки управления -->
      <div class="action-buttons">
        <button class="edit-btn" @click="openEditForm" :disabled="editing">
          ✏️ Редактировать
        </button>
        <button class="delete-btn" @click="deletePost" :disabled="deleting">
          🗑️ {{ deleting ? 'Удаление...' : 'Удалить' }}
        </button>
      </div>

      <!-- Режим редактирования -->
      <div v-if="editing" class="edit-section">
        <h2>✏️ Редактирование поста</h2>
        <form @submit.prevent="savePostEdit" class="edit-form">
          <div class="form-group">
            <label>Заголовок</label>
            <input
                v-model="editForm.title"
                type="text"
                required
                placeholder="Введите заголовок"
                class="input-field"
            >
          </div>

          <div class="form-group">
            <label>Краткое описание</label>
            <textarea
                v-model="editForm.briefDescription"
                required
                rows="2"
                placeholder="Краткое описание поста"
                class="input-field"
            ></textarea>
          </div>

          <div class="form-group">
            <label>Полное описание</label>
            <textarea
                v-model="editForm.fullDescription"
                required
                rows="4"
                placeholder="Полное содержание поста"
                class="input-field"
            ></textarea>
          </div>

          <div class="edit-buttons">
            <button type="submit" class="save-btn">💾 Сохранить</button>
            <button type="button" class="cancel-btn" @click="closeEditForm">❌ Отмена</button>
          </div>
        </form>
      </div>

      <!-- Просмотр поста -->
      <div v-else>
        <h1 class="post-title">{{ post.title }}</h1>

        <div class="post-brief">
          <h3>Краткое описание</h3>
          <p>{{ post.briefDescription }}</p>
        </div>

        <div class="post-full">
          <h3>Полное описание</h3>
          <p>{{ post.fullDescription }}</p>
        </div>

        <div class="post-date">
          📅 {{ formatDate(post.dateTime) }}
        </div>
      </div>

      <!-- Комментарии (показываются всегда) -->
      <div class="comments-section">
        <h2>💬 Комментарии ({{ post.comments?.length || 0 }})</h2>

        <div v-if="!post.comments || post.comments.length === 0" class="no-comments">
          <p>😕 Пока нет комментариев</p>
          <p>Будьте первым, кто оставит комментарий!</p>
        </div>

        <div v-else class="comments-list">
          <div
              v-for="comment in post.comments"
              :key="comment.id"
              class="comment-card"
          >
            <div class="comment-header">
              <span class="comment-author">✍️ {{ comment.userInfo || comment.email }}</span>
              <span class="comment-email">📧 {{ comment.email }}</span>
              <span class="comment-date">📅 {{ formatDate(comment.dateTime) }}</span>
              <button
                  class="delete-comment-btn"
                  @click="deleteComment(comment.id)"
                  :disabled="deletingCommentId === comment.id"
                  title="Удалить комментарий"
              >
                {{ deletingCommentId === comment.id ? '...' : '🗑️' }}
              </button>
            </div>
            <p class="comment-text">{{ comment.textComment }}</p>
          </div>
        </div>
      </div>

      <!-- Форма добавления комментария -->
      <div class="add-comment-section">
        <h2>📝 Добавить комментарий</h2>
        <form @submit.prevent="addComment" class="add-comment-form">
          <div class="form-group">
            <input
                v-model="newComment.userInfo"
                type="text"
                :class="['input-field', { error: commentErrors.userInfo }]"
                placeholder="Как вас зовут?"
            />
            <span v-if="commentErrors.userInfo" class="error-text">{{ commentErrors.userInfo }}</span>
            <span class="char-counter">{{ newComment.userInfo.length }}/50</span>
          </div>

          <div class="form-group">
            <input
                v-model="newComment.email"
                type="email"
                :class="['input-field', { error: commentErrors.email }]"
                placeholder="your@email.com"
            />
            <span v-if="commentErrors.email" class="error-text">{{ commentErrors.email }}</span>
            <span class="char-counter">{{ newComment.email.length }}/50</span>
          </div>

          <div class="form-group">
            <textarea
                v-model="newComment.textComment"
                :class="['input-field', { error: commentErrors.textComment }]"
                rows="4"
                placeholder="Ваш комментарий..."
            ></textarea>
            <span v-if="commentErrors.textComment" class="error-text">{{ commentErrors.textComment }}</span>
            <span class="char-counter">{{ newComment.textComment.length }}/255</span>
          </div>

          <button type="submit" :disabled="submitting" class="submit-btn">
            {{ submitting ? 'Отправка...' : '💬 Отправить комментарий' }}
          </button>
        </form>
      </div>
    </div>

    <div v-if="message" :class="['message', messageType]">
      {{ message }}
    </div>
  </div>
</template>

<style scoped>
.note-detail-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  min-height: 100vh;
  border-radius: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
  margin-right: 10px;
  transition: all 0.3s ease;
  font-family: 'Commissioner', sans-serif;
  font-weight: 500;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateX(-4px);
}

.loading, .not-found {
  background: white;
  border-radius: 16px;
  padding: 60px;
  text-align: center;
  font-family: 'Commissioner', sans-serif;
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

.post-section {
  background: white;
  border-radius: 20px;
  padding: 30px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  font-family: 'Commissioner', sans-serif;
}

.action-buttons {
  display: flex;
  gap: 15px;
  justify-content: flex-end;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;
}

.edit-btn, .delete-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  font-family: 'Commissioner', sans-serif;
}

.edit-btn {
  background: #667eea;
  color: white;
}

.edit-btn:hover:not(:disabled) {
  background: #5a67d8;
  transform: translateY(-2px);
}

.delete-btn {
  background: #f44336;
  color: white;
}

.delete-btn:hover:not(:disabled) {
  background: #d32f2f;
  transform: translateY(-2px);
}

.edit-btn:disabled, .delete-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.edit-section {
  background: #f9f9f9;
  border-radius: 16px;
  padding: 25px;
  margin-bottom: 25px;
  font-family: 'Commissioner', sans-serif;
}

.edit-section h2 {
  margin: 0 0 20px 0;
  color: #333;
  font-size: 1.3em;
  font-family: 'Commissioner', sans-serif;
  font-weight: 600;
}

.edit-form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.edit-buttons {
  display: flex;
  gap: 15px;
  margin-top: 10px;
}

.save-btn, .cancel-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  font-family: 'Commissioner', sans-serif;
}

.save-btn {
  background: #4caf50;
  color: white;
}

.save-btn:hover {
  background: #45a049;
  transform: translateY(-2px);
}

.cancel-btn {
  background: #999;
  color: white;
}

.cancel-btn:hover {
  background: #777;
  transform: translateY(-2px);
}

.post-title {
  margin: 0 0 20px 0;
  color: #333;
  font-size: 2em;
  font-weight: 600;
  border-bottom: 2px solid #667eea;
  padding-bottom: 15px;
  font-family: 'Commissioner', sans-serif;
  word-wrap: break-word;
  white-space: normal;
}

.post-brief, .post-full {
  margin-bottom: 25px;
}

.post-brief h3, .post-full h3 {
  color: #667eea;
  margin-bottom: 10px;
  font-size: 1.2em;
  font-family: 'Commissioner', sans-serif;
  font-weight: 600;
}

.post-brief p, .post-full p {
  color: #555;
  line-height: 1.6;
  margin: 0;
  font-family: 'Commissioner', sans-serif;
  word-wrap: break-word;
  white-space: normal;
}

.post-date {
  color: #999;
  font-size: 0.9em;
  padding: 15px 0;
  border-top: 1px solid #eee;
  border-bottom: 1px solid #eee;
  margin-bottom: 30px;
  font-family: 'Commissioner', sans-serif;
}

.comments-section {
  margin-bottom: 30px;
}

.comments-section h2 {
  color: #333;
  margin-bottom: 20px;
  font-size: 1.5em;
  font-family: 'Commissioner', sans-serif;
  font-weight: 600;
}

.no-comments {
  background: #f9f9f9;
  border-radius: 12px;
  padding: 30px;
  text-align: center;
  color: #999;
  font-family: 'Commissioner', sans-serif;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.comment-card {
  background: #f9f9f9;
  border-radius: 12px;
  padding: 15px;
  transition: all 0.2s ease;
  font-family: 'Commissioner', sans-serif;
}

.comment-card:hover {
  background: #f0f0ff;
}

.comment-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 15px;
  margin-bottom: 10px;
  font-size: 0.85em;
}

.comment-author {
  font-weight: 600;
  color: #667eea;
  font-family: 'Commissioner', sans-serif;
}

.comment-email {
  color: #999;
  font-family: 'Commissioner', sans-serif;
}

.comment-date {
  color: #bbb;
  font-family: 'Commissioner', sans-serif;
}

.delete-comment-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 14px;
  color: #999;
  transition: all 0.2s ease;
  padding: 4px 8px;
  border-radius: 6px;
  margin-left: auto;
}

.delete-comment-btn:hover:not(:disabled) {
  background: #fee;
  color: #e74c3c;
}

.delete-comment-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.comment-text {
  color: #555;
  line-height: 1.5;
  margin: 0;
  padding-top: 8px;
  border-top: 1px solid #eee;
  font-family: 'Commissioner', sans-serif;
  word-wrap: break-word;
  white-space: normal;
}

.add-comment-section {
  background: #f9f9f9;
  border-radius: 16px;
  padding: 25px;
  margin-top: 20px;
  font-family: 'Commissioner', sans-serif;
}

.add-comment-section h2 {
  color: #333;
  margin-bottom: 20px;
  font-size: 1.3em;
  font-family: 'Commissioner', sans-serif;
  font-weight: 600;
}

.add-comment-form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.input-field {
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.3s;
  background: white;
  font-family: 'Commissioner', sans-serif;
}

.input-field:focus {
  outline: none;
  border-color: #667eea;
}

textarea.input-field {
  resize: vertical;
}

.submit-btn {
  padding: 12px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  margin-top: 10px;
  font-family: 'Commissioner', sans-serif;
}

.submit-btn:hover:not(:disabled) {
  background: #5a67d8;
  transform: translateY(-2px);
}

.submit-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
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
  font-family: 'Commissioner', sans-serif;
  font-weight: 500;
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

.back-home-btn {
  margin-top: 20px;
  padding: 10px 20px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-family: 'Commissioner', sans-serif;
  font-weight: 500;
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
  .note-detail-container {
    padding: 15px;
  }

  .post-section {
    padding: 20px;
  }

  .post-title {
    font-size: 1.5em;
  }

  .comment-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
  }

  .delete-comment-btn {
    margin-left: 0;
    align-self: flex-end;
  }

  .action-buttons {
    justify-content: center;
  }

  .edit-buttons {
    flex-direction: column;
  }
}
</style>