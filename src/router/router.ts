import { createRouter, createWebHistory } from 'vue-router'
import { isAuthenticated } from '@/service/auth'

const routes = [
    {
        path: '/login',
        component: () => import('@/pages/Login.vue'),
        name: 'Login',
        meta: { auth: false },
    },
    {
        path: '/',
        component: () => import('@/pages/Home.vue'),
        name: 'Home',
        meta: { auth: true },
    },
    {
        path: '/user/:userId',
        component: () => import('@/pages/UserDetail.vue'),
        name: 'User',
        meta: { auth: true },
        children: [
            {
                path: 'post/:postId',
                component: () => import('@/pages/PostDetail.vue'),
                name: 'postDetail',
            }
        ]
    },
    {
        path: '/post/:postId',
        component: () => import('@/pages/PostDetail.vue'),
        name: 'postDetailStandalone',
        meta: { auth: true },
    }
];

const router = createRouter({
    history: createWebHistory(),
    routes
})

router.beforeEach((to, from, next) => {
    const reqAuth = to.meta.auth

    if (isAuthenticated() && to.name === 'Login') return next({name: 'Home'})

    if (!reqAuth){
        next()
        return
    }
    
    isAuthenticated() ? next() : next({ name: 'Login' })
})

export default router
