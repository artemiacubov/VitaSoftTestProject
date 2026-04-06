export const formatDate = (dateString: string): string => {
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

export const showMessage = (
    message: { value: string },
    messageType: { value: 'success' | 'error' },
    text: string,
    type: 'success' | 'error'
) => {
    message.value = text
    messageType.value = type
    setTimeout(() => {
        if (message.value === text) message.value = ''
    }, 3000)
}