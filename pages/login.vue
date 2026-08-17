<template>
  <div class="min-h-[85vh] flex flex-col justify-center">
    <div class="text-center mb-8">
      <h1 class="text-2xl font-bold dark:text-slate-100">Janice Store Utang Tracker</h1>
      <p class="text-slate-500 dark:text-slate-400 text-sm mt-1">Admin sign in</p>
    </div>

    <form @submit.prevent="handleLogin" class="space-y-3">
      <div>
        <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
        <input v-model="email" type="email" required autocomplete="email"
          class="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 px-4 py-3 text-base outline-none focus:border-emerald-500" />
      </div>
      <div>
        <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
        <input v-model="password" type="password" required autocomplete="current-password"
          class="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 px-4 py-3 text-base outline-none focus:border-emerald-500" />
      </div>

      <label class="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 select-none">
        <input v-model="rememberMe" type="checkbox" class="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-emerald-600 focus:ring-emerald-500" />
        Remember me
      </label>

      <p v-if="errorMsg" class="text-sm text-rose-600 dark:text-rose-400">{{ errorMsg }}</p>

      <button type="submit" :disabled="loading"
        class="w-full rounded-xl bg-emerald-600 text-white font-semibold py-3 mt-2 active:opacity-80 disabled:opacity-50">
        {{ loading ? 'Signing in…' : 'Sign in' }}
      </button>
    </form>

    <div class="flex justify-between mt-4 text-sm">
      <NuxtLink to="/forgot-password" class="text-emerald-600 dark:text-emerald-400 font-medium">Forgot password?</NuxtLink>
      <NuxtLink to="/register" class="text-slate-400 dark:text-slate-500">First-time setup</NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })

const email = ref('')
const password = ref('')
const rememberMe = ref(true)
const loading = ref(false)
const errorMsg = ref('')

const { login } = useAuth()
const router = useRouter()
const toast = useToast()

async function handleLogin() {
  errorMsg.value = ''
  loading.value = true
  try {
    await login(email.value, password.value, rememberMe.value)
    toast.success('Welcome back!')
    router.push('/')
  } catch (e: any) {
    errorMsg.value = friendlyError(e?.code)
  } finally {
    loading.value = false
  }
}

function friendlyError(code?: string) {
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Incorrect email or password.'
    case 'auth/too-many-requests':
      return 'Too many attempts. Try again later.'
    default:
      return 'Could not sign in. Please try again.'
  }
}
</script>
