import { createRouter, createWebHistory } from 'vue-router'
import { useSessionStore } from '@/features/auth-session'
const connected = () => import('@/pages/connected/ui/ConnectedPage.vue')
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior: () => ({ top: 0 }),
  routes: [
    {
      path: '/login',
      component: () => import('@/features/auth-session/ui/LoginScreen.vue'),
      meta: { public: true, title: 'Вход' },
    },
    {
      path: '/',
      component: connected,
      props: { screen: 'overview' },
      meta: { title: 'Рабочее пространство' },
    },
    {
      path: '/clients',
      component: connected,
      props: { screen: 'clients' },
      meta: { title: 'Клиенты', staff: true },
    },
    {
      path: '/clients/:clientId',
      component: connected,
      props: (route) => ({ screen: 'client', clientId: route.params.clientId }),
      meta: { title: 'Карточка клиента', staff: true },
    },
    {
      path: '/conversations',
      component: connected,
      props: { screen: 'conversations' },
      meta: { title: 'Обращения и переписка' },
    },
    { path: '/deals', component: connected, props: { screen: 'deals' }, meta: { title: 'Сделки' } },
    {
      path: '/offers',
      component: connected,
      props: { screen: 'offers' },
      meta: { title: 'Коммерческие предложения' },
    },
    {
      path: '/ai',
      component: connected,
      props: { screen: 'ai' },
      meta: { title: 'AI-помощник', staff: true },
    },
    {
      path: '/competitors',
      component: connected,
      props: { screen: 'competitors' },
      meta: { title: 'Анализ рынка', staff: true },
    },
    {
      path: '/team',
      component: connected,
      props: { screen: 'team' },
      meta: { title: 'Команда продаж', supervisor: true },
    },
    {
      path: '/profile',
      component: connected,
      props: { screen: 'profile' },
      meta: { title: 'Мой профиль', client: true },
    },
    {
      path: '/construction',
      component: () => import('@/pages/connected/ui/CatalogPage.vue'),
      meta: { title: 'Каталог объектов' },
    },
    {
      path: '/construction/:objectId',
      component: () => import('@/pages/connected/ui/CatalogPage.vue'),
      props: true,
      meta: { title: 'Карточка объекта' },
    },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})
router.beforeEach(async (to) => {
  const session = useSessionStore()
  await session.restore()
  if (!session.isAuthenticated && !to.meta.public) return '/login'
  if (session.isAuthenticated && to.path === '/login') return '/'
  if ((to.meta.staff && !session.isStaff) || (to.meta.client && session.isStaff)) return '/'
  if (to.meta.supervisor && session.user?.role !== 'supervisor') return '/'
})
export default router
