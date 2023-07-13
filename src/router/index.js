import { createRouter, createWebHistory } from 'vue-router'
import store2 from "store2";

const allRoutes = [
    {
        path: '/',
        redirect: '/login'
      },
    {
        path: '/login',
        name: 'Login',
        component: () => import('../components/wallet/RegirstButton.vue'),
        meta: {
          title: '登录'
        }
      },
      {
        path: '/info',
        name: 'info',
        component: () => import('../components/wallet/AccountInfo.vue'),
        meta: {
          title: '信息'
        }
      }
]
const router = createRouter({
  history: createWebHistory(),
  routes: allRoutes
})

router.beforeEach((to, from, next) => {
const walletInfo = store2.has("walletInfo") ? store2.get("walletInfo") : [];
    if(walletInfo.length == 0 && to.path !='/login'){
        next('/login')
    }else{
        next()
    }
})

export default router
