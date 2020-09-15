import Vue from 'vue'
import VueRouter from 'vue-router'
import Login from '../components/Login'
import Home from '../components/Home'
import Welcome from '../components/Welcome'
import Users from '../components/user/Users'
import Roles from '../components/role/Roles'

Vue.use(VueRouter)

const routes = [
  // 自定义重定向规则
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    component: Login
  },
  {
    path: '/home',
    component: Home,
    redirect: '/welcome',
    children: [
      {
        path: '/welcome',
        component: Welcome
      },
      {
        path: '/users',
        component: Users
      },
      {
        path: '/roles',
        component: Roles
      }
    ]
  }
]

const router = new VueRouter({
  // 不显示'#'
  model: 'history',
  routes
})

// 挂载路由导航守卫，判断是否有权限进入某些特定页面
router.beforeEach((to, from, next) => {
  // to 将要访问的路径
  // from代表从哪个路径跳转过来
  // next是一个函数，表示放行。 next()：放行    next('/login')：强制跳转

  // 1.登录页面不需要做权限控制
  if (to.path === '/login') {
    return next()
  }
  // 2.有权限的页面需要拿到token，根据有无token再决定是否放行
  //   2.1 获取token
  const tokenStr = window.sessionStorage.getItem('token')
  //   2.2 如果token不存在，强制跳转到登录页
  if (!tokenStr) {
    return next('/login')
  }
  //  2.3 如果token存在，直接放行
  next()
})

export default router
