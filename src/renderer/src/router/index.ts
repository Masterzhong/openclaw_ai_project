import { createRouter, createWebHashHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Analysis from '../views/Analysis.vue'
import Report from '../views/Report.vue'
import Settings from '../views/Settings.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'home', component: Home },
    { path: '/analysis', name: 'analysis', component: Analysis },
    { path: '/report', name: 'report', component: Report },
    { path: '/settings', name: 'settings', component: Settings }
  ]
})

export default router
