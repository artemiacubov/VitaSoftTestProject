<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUsers } from '@/composables/useUsers'
import type { IPost } from '@/type/api.type'
import { formatDate } from '@/service/helpers.ts'

const router = useRouter()
const { users, loading, error, loadUsers } = useUsers()

const currentPage = ref(1)
const postsPerPage = ref(3)

const goToUserDetail = (userId: number) => {
  router.push(`/user/${userId}`)
}

const goToNoteDetail = (postId: number) => {
  router.push(`/post/${postId}`)
}

const allPosts = computed<{ post: IPost; authorName: string; userId: number }[]>(() => {
  const posts: { post: IPost; authorName: string; userId: number }[] = []

  users.value.forEach(user => {
    if (user.post && user.post.length > 0) {
      user.post.forEach(post => {
        posts.push({
          post,
          authorName: user.fullName || `Пользователь ${user.id}`,
          userId: user.id
        })
      })
    }
  })

  return posts.sort((a, b) =>
      new Date(b.post.dateTime).getTime() - new Date(a.post.dateTime).getTime()
  )
})

const paginatedPosts = computed(() => {
  const start = (currentPage.value - 1) * postsPerPage.value
  const end = start + postsPerPage.value
  return allPosts.value.slice(start, end)
})

const totalPages = computed(() =>
    Math.ceil(allPosts.value.length / postsPerPage.value)
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

const changePage = (page: number) => {
  if (page === -1) return
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(() => {
  loadUsers()
})
</script>

<template>
  <div class="home-container">
    <h1>Все записи пользователей</h1>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Загрузка...</p>
    </div>

    <div v-else-if="error" class="error">
      {{ error }}
    </div>

    <div v-else-if="allPosts.length === 0" class="empty">
      <p>😕 Пока нет ни одной записи</p>
      <p>Будьте первым, кто создаст пост!</p>
    </div>

    <div v-else class="posts-list">
      <div
          v-for="item in paginatedPosts"
          :key="item.post.id"
          class="post-card"
          @click="goToNoteDetail(item.post.id)"
      >
        <div class="post-header">
          <h2 class="post-title">{{ item.post.title }}</h2>
          <span
              class="post-author clickable"
              @click.stop="goToUserDetail(item.userId)"
          >
            ✍️ {{ item.authorName }}
          </span>
        </div>

        <p class="post-brief">{{ item.post.briefDescription }}</p>
        <p class="post-full">{{ item.post.fullDescription }}</p>

        <div class="post-footer">
          <span class="post-date">📅 {{ formatDate(item.post.dateTime) }}</span>
          <span class="post-comments">
            💬 {{ item.post.comments?.length || 0 }} комментариев
          </span>
        </div>
      </div>
    </div>

    <div v-if="totalPages > 1" class="pagination">
      <button
          @click="changePage(currentPage - 1)"
          :disabled="currentPage === 1"
          class="page-btn"
      >
        🡄 Назад
      </button>

      <div class="page-numbers">
        <button
            v-for="page in visiblePages"
            :key="page"
            @click="changePage(page)"
            :class="['page-number', { active: page === currentPage }]"
        >
          {{ page === -1 ? '...' : page }}
        </button>
      </div>

      <button
          @click="changePage(currentPage + 1)"
          :disabled="currentPage === totalPages"
          class="page-btn"
      >
        Вперед 🡆
      </button>
    </div>
  </div>
</template>

<style scoped>
.home-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 16px 20px;
  min-height: 96.6vh;
  border-radius: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

h1 {
  color: white;
  text-align: center;
  font-size: 2em;
  margin-bottom: 20px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
}

.loading, .empty, .error {
  background: white;
  border-radius: 16px;
  padding: 40px;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
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

.error {
  color: #d32f2f;
  border-left: 4px solid #f44336;
}

.empty p:first-child {
  font-size: 1.5em;
  color: #667eea;
  margin-bottom: 10px;
}

.empty p:last-child {
  color: #999;
}

.posts-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.post-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  cursor: pointer;
}

.post-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.post-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 12px;
  flex-wrap: wrap;
  gap: 10px;
}

.post-title {
  margin: 0;
  font-size: 1.3em;
  color: #333;
  font-weight: 600;
}

.post-author {
  color: #667eea;
  font-size: 0.9em;
  font-weight: 500;
  background: #f0f0ff;
  padding: 4px 12px;
  border-radius: 20px;
}

.post-author.clickable {
  cursor: pointer;
  transition: all 0.2s ease;
}

.post-author.clickable:hover {
  background: #667eea;
  color: white;
  transform: scale(1.02);
}

.post-brief {
  color: #666;
  line-height: 1.5;
  margin: 12px 0;
  font-size: 1em;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.post-full {
  color: #888;
  line-height: 1.6;
  margin: 12px 0;
  padding-top: 12px;
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
  margin-top: 16px;
  padding-top: 16px;
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

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-top: 30px;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
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

@media (max-width: 768px) {
  .home-container {
    padding: 15px;
  }

  h1 {
    font-size: 1.8em;
  }

  .post-header {
    flex-direction: column-reverse;;
  }

  .post-title {
    font-size: 1.2em;
  }

  .post-footer {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .pagination {
    flex-wrap: wrap;
  }

  .page-numbers {
    order: 3;
    width: 100%;
    justify-content: center;
  }
}
</style>