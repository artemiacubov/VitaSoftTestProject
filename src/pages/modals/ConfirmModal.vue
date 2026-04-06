<script setup lang="ts">
import { ref } from 'vue'

const visible = ref(false)
const titleText = ref('')
const messageText = ref('')
let resolveCallback: ((value: boolean) => void) | null = null

const open = (title: string, message: string): Promise<boolean> => {
  return new Promise((resolve) => {
    titleText.value = title
    messageText.value = message
    visible.value = true
    resolveCallback = resolve
  })
}

const close = () => {
  visible.value = false
  if (resolveCallback) {
    resolveCallback(false)
    resolveCallback = null
  }
}

const confirm = () => {
  visible.value = false
  if (resolveCallback) {
    resolveCallback(true)
    resolveCallback = null
  }
}

defineExpose({ open })
</script>

<template>
  <div v-if="visible" class="modal-overlay" @click.self="close">
    <div class="modal-container">
      <div class="modal-header">
        <h3>{{ titleText }}</h3>
        <button class="close-btn" @click="close">✕</button>
      </div>
      <div class="modal-body">
        <p>{{ messageText }}</p>
      </div>
      <div class="modal-footer">
        <button class="cancel-btn" @click="close">Отмена</button>
        <button class="confirm-btn" @click="confirm">Удалить</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  animation: fadeIn 0.2s ease;
}

.modal-container {
  background: white;
  border-radius: 16px;
  width: 400px;
  max-width: 90%;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  animation: slideIn 0.2s ease;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #eee;
}

.modal-header h3 {
  margin: 0;
  color: #333;
  font-size: 1.2em;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #999;
  transition: color 0.2s;
}

.close-btn:hover {
  color: #333;
}

.modal-body {
  padding: 20px;
}

.modal-body p {
  margin: 0;
  color: #555;
  line-height: 1.5;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 20px;
  border-top: 1px solid #eee;
}

.cancel-btn, .confirm-btn {
  padding: 8px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.cancel-btn {
  background: #e0e0e0;
  color: #666;
}

.cancel-btn:hover {
  background: #ccc;
}

.confirm-btn {
  background: #f44336;
  color: white;
}

.confirm-btn:hover {
  background: #d32f2f;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>