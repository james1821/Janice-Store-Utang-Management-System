<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 flex flex-col lg:flex-row transition-colors">
    <!-- Desktop sidebar (hidden on mobile — mobile keeps its header + bottom nav, untouched) -->
    <aside
      v-if="showChrome"
      class="hidden lg:flex lg:flex-col lg:w-64 xl:w-72 lg:shrink-0 lg:h-screen lg:sticky lg:top-0 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700"
    >
      <div class="px-6 py-6 border-b border-slate-100 dark:border-slate-700/60">
        <NuxtLink to="/" class="flex items-center gap-3 group">
          <span class="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-base shrink-0 shadow-sm shadow-emerald-600/30">JS</span>
          <span class="min-w-0">
            <span class="block font-bold text-[15px] leading-tight tracking-tight text-slate-900 dark:text-slate-100 truncate">Janice Store</span>
            <span class="block text-xs font-medium text-emerald-600 dark:text-emerald-400">Utang Tracker</span>
          </span>
        </NuxtLink>
      </div>

      <nav class="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p class="px-4 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Menu</p>
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
          :class="isActive(item.to) ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'"
        >
          <component :is="item.icon" :size="19" :stroke-width="isActive(item.to) ? 2.25 : 2" />
          {{ item.label }}
        </NuxtLink>
      </nav>

      <div class="px-3 py-4 border-t border-slate-200 dark:border-slate-700 space-y-0.5">
        <button
          @click="toggle"
          class="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
        >
          <Sun v-if="isDark" :size="17" />
          <Moon v-else :size="17" />
          {{ isDark ? 'Light mode' : 'Dark mode' }}
        </button>
        <button
          v-if="currentUser"
          @click="handleLogout"
          class="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
        >
          <LogOut :size="17" /> Log out
        </button>
      </div>
    </aside>

    <div class="flex-1 flex flex-col min-w-0" :class="showChrome ? 'lg:h-screen lg:overflow-hidden' : ''">
      <!-- Mobile header — unchanged, hidden on desktop -->
      <header
        v-if="showChrome"
        class="lg:hidden sticky top-0 z-40 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-3 flex items-center justify-between"
      >
        <NuxtLink to="/" class="font-bold text-base leading-tight tracking-tight text-slate-900 dark:text-slate-100 pr-2">
          Janice Store <span class="text-emerald-600 dark:text-emerald-400">Utang Tracker</span>
        </NuxtLink>
        <div class="flex items-center gap-3">
          <button
            @click="toggle"
            class="w-8 h-8 flex items-center justify-center rounded-full text-slate-500 dark:text-slate-300 active:bg-slate-100 dark:active:bg-slate-700"
            :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
          >
            <Sun v-if="isDark" :size="18" />
            <Moon v-else :size="18" />
          </button>
          <button
            v-if="currentUser"
            @click="handleLogout"
            class="text-sm text-slate-500 dark:text-slate-400 active:text-slate-700 dark:active:text-slate-200"
          >
            Log out
          </button>
        </div>
      </header>

      <!-- Desktop topbar — page title bar, hidden on mobile -->
      <header
        v-if="showChrome"
        class="hidden lg:flex items-center justify-between h-16 shrink-0 px-8 xl:px-10 border-b border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 backdrop-blur sticky top-0 z-30"
      >
        <p class="text-sm font-medium text-slate-500 dark:text-slate-400">{{ pageLabel }}</p>
        <div class="flex items-center gap-2">
          <span v-if="currentUser?.email" class="text-sm text-slate-400 dark:text-slate-500">{{ currentUser.email }}</span>
          <span class="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-300">
            <User2 :size="16" />
          </span>
        </div>
      </header>

      <main
        class="flex-1 px-4 py-4 max-w-lg w-full mx-auto lg:px-8 lg:py-8 xl:px-10 xl:py-10 lg:min-h-0 lg:overflow-y-auto lg:flex lg:flex-col"
        :class="showChrome ? 'pb-24 lg:max-w-none lg:pb-12' : 'pb-4 lg:max-w-md lg:pb-10'"
      >
        <slot />
        <p class="text-center text-[11px] text-slate-300 dark:text-slate-600 pt-8 pb-2 lg:hidden">Made by JamesDev</p>
      </main>

      <!-- Desktop footer credit — kept outside the scrollable main area so it never causes pages that pin their content to shift -->
      <!-- <p v-if="showChrome" class="hidden lg:block shrink-0 text-center text-[11px] text-slate-300 dark:text-slate-600 py-2.5 border-t border-slate-200 dark:border-slate-700">
        Made by JamesDev
      </p> -->

      <!-- Mobile bottom nav — unchanged, hidden on desktop -->
      <nav
        v-if="showChrome"
        class="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex items-stretch justify-around max-w-lg mx-auto"
      >
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-xs font-medium"
          :class="isActive(item.to) ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'"
        >
          <component :is="item.icon" :size="20" :stroke-width="isActive(item.to) ? 2.25 : 2" />
          {{ item.label }}
        </NuxtLink>
      </nav>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Home, Users, Calendar, ShoppingCart, Save, Sun, Moon, LogOut, User2 } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const { currentUser, logout } = useAuth()
const { isDark, toggle } = useDarkMode()
const toast = useToast()

const showChrome = computed(() => !['/login', '/register', '/forgot-password'].includes(route.path) && !route.path.startsWith('/share/'))

const navItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/people', icon: Users, label: 'Customers' },
  { to: '/calendar', icon: Calendar, label: 'Calendar' },
  { to: '/products', icon: ShoppingCart, label: 'Products' },
  { to: '/backup', icon: Save, label: 'Backup' }
]

function isActive(to: string) {
  return to === '/' ? route.path === '/' : route.path.startsWith(to)
}

const pageLabel = computed(() => {
  const match = navItems.find((item) => isActive(item.to))
  if (match) return match.label
  if (route.path.startsWith('/people/')) return 'Customer profile'
  if (route.path.startsWith('/utangs/')) return 'Utang details'
  return 'Janice Store'
})

async function handleLogout() {
  await logout()
  toast.info('Logged out')
  router.push('/login')
}
</script>
