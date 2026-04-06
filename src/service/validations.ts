// Валидация заголовка поста
export const validateTitle = (title: string): { isValid: boolean; error: string } => {
    if (!title) {
        return { isValid: false, error: 'Заголовок обязателен' }
    }
    if (title.length > 50) {
        return { isValid: false, error: 'Заголовок не должен превышать 50 символов' }
    }
    return { isValid: true, error: '' }
}

// Валидация краткого описания поста
export const validateBriefDescription = (briefDescription: string): { isValid: boolean; error: string } => {
    if (!briefDescription) {
        return { isValid: false, error: 'Краткое описание обязательно' }
    }
    if (briefDescription.length > 100) {
        return { isValid: false, error: 'Краткое описание не должно превышать 100 символов' }
    }
    return { isValid: true, error: '' }
}

// Валидация полного описания поста
export const validateFullDescription = (fullDescription: string): { isValid: boolean; error: string } => {
    if (fullDescription.length > 255) {
        return { isValid: false, error: 'Полное описание не должно превышать 255 символов' }
    }
    return { isValid: true, error: '' }
}

// Валидация имени комментатора
export const validateCommentUserInfo = (userInfo: string): { isValid: boolean; error: string } => {
    if (userInfo && userInfo.length > 50) {
        return { isValid: false, error: 'Имя не должно превышать 50 символов' }
    }
    return { isValid: true, error: '' }
}

// Валидация email комментатора
export const validateCommentEmail = (email: string): { isValid: boolean; error: string } => {
    if (!email) {
        return { isValid: false, error: 'Email обязателен' }
    }
    if (email.length > 50) {
        return { isValid: false, error: 'Email не должен превышать 50 символов' }
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
        return { isValid: false, error: 'Введите корректный email' }
    }
    return { isValid: true, error: '' }
}

// Валидация текста комментария
export const validateCommentText = (text: string): { isValid: boolean; error: string } => {
    if (!text) {
        return { isValid: false, error: 'Текст комментария обязателен' }
    }
    if (text.length > 255) {
        return { isValid: false, error: 'Текст комментария не должен превышать 255 символов' }
    }
    return { isValid: true, error: '' }
}