<template>
  <div class="min-h-[85vh] flex flex-col justify-center">
    <div class="text-center mb-6">
      <div class="text-4xl mb-2">🔐</div>
      <h1 class="text-2xl font-bold dark:text-slate-100">Create admin account</h1>
      <p class="text-slate-500 dark:text-slate-400 text-sm mt-1 px-4">
        This is a one-time setup step. After creating the account, copy your UID into
        <code class="bg-slate-100 dark:bg-slate-700 px-1 rounded">NUXT_PUBLIC_ADMIN_UID</code> so only you can access the store data.
      </p>
    </div>

    <form @submit.prevent="handleRegister" class="space-y-3">
      <div>
        <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
        <input v-model="email" type="email" required autocomplete="email"
          class="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 px-4 py-3 text-base outline-none focus:border-emerald-500" />
      </div>
      <div>
        <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
        <input v-model="password" type="password" required minlength="6" autocomplete="new-password"
          class="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 px-4 py-3 text-base outline-none focus:border-emerald-500" />
        <p class="text-xs text-slate-400 dark:text-slate-500 mt-1">At least 6 characters.</p>
      </div>

      <p v-if="errorMsg" class="text-sm text-rose-600 dark:text-rose-400">{{ errorMsg }}</p>
      <p v-if="createdUid" class="text-sm text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg p-3 break-all">
        Account created! Your UID is <strong>{{ createdUid }}</strong>. Save this into your <code>.env</code> file.
      </p>

      <button type="submit" :disabled="loading"
        class="w-full rounded-xl bg-emerald-600 text-white font-semibold py-3 mt-2 active:opacity-80 disabled:opacity-50">
        {{ loading ? 'Creating…' : 'Create account' }}
      </button>
    </form>

    <NuxtLink to="/login" class="text-center text-emerald-600 dark:text-emerald-400 font-medium text-sm mt-4">Back to sign in</NuxtLink>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })

const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMsg = ref('')
const createdUid = ref('')

const { register } = useAuth()
const router = useRouter()

async function handleRegister() {
  errorMsg.value = ''
  loading.value = true
  try {
    const user = await register(email.value, password.value)
    createdUid.value = user.uid
    setTimeout(() => router.push('/'), 2500)
  } catch (e: any) {
    errorMsg.value = e?.code === 'auth/email-already-in-use' ? 'That email is already registered.' : 'Could not create account.'
  } finally {
    loading.value = false
  }
}
</script>
