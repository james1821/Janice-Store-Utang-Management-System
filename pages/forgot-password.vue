<template>
  <div class="min-h-[85vh] flex flex-col justify-center">
    <div class="text-center mb-6">
      <div class="text-4xl mb-2">✉️</div>
      <h1 class="text-2xl font-bold dark:text-slate-100">Reset password</h1>
      <p class="text-slate-500 dark:text-slate-400 text-sm mt-1">We'll email you a reset link.</p>
    </div>

    <form @submit.prevent="handleReset" class="space-y-3">
      <div>
        <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
        <input v-model="email" type="email" required autocomplete="email"
          class="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 px-4 py-3 text-base outline-none focus:border-emerald-500" />
      </div>

      <p v-if="message" class="text-sm text-emerald-700 dark:text-emerald-400">{{ message }}</p>
      <p v-if="errorMsg" class="text-sm text-rose-600 dark:text-rose-400">{{ errorMsg }}</p>

      <button type="submit" :disabled="loading"
        class="w-full rounded-xl bg-emerald-600 text-white font-semibold py-3 mt-2 active:opacity-80 disabled:opacity-50">
        {{ loading ? 'Sending…' : 'Send reset link' }}
      </button>
    </form>

    <NuxtLink to="/login" class="text-center text-emerald-600 dark:text-emerald-400 font-medium text-sm mt-4">Back to sign in</NuxtLink>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })

const email = ref('')
const loading = ref(false)
const message = ref('')
const errorMsg = ref('')
const { resetPassword } = useAuth()

async function handleReset() {
  message.value = ''
  errorMsg.value = ''
  loading.value = true
  try {
    await resetPassword(email.value)
    message.value = 'Check your inbox for a reset link.'
  } catch {
    errorMsg.value = 'Could not send reset email. Check the address and try again.'
  } finally {
    loading.value = false
  }
}
</script>
