import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  type User
} from 'firebase/auth'

const currentUser = ref<User | null>(null)
const authReady = ref(false)
let listenerAttached = false
let resolveReady: () => void
const authReadyPromise = new Promise<void>((resolve) => {
  resolveReady = resolve
})

export function useAuth() {
  const { $auth } = useNuxtApp()
  const config = useRuntimeConfig()

  if (!listenerAttached) {
    listenerAttached = true
    onAuthStateChanged($auth as any, (user) => {
      currentUser.value = user
      authReady.value = true
      resolveReady()
    })
  }

  const isAdmin = computed(() => {
    if (!currentUser.value) return false
    const adminUid = config.public.adminUid
    // If an admin UID is configured, enforce it. Otherwise allow any authenticated user
    // (useful for first-time setup before you've copied your UID into .env).
    return adminUid ? currentUser.value.uid === adminUid : true
  })

  async function login(email: string, password: string, rememberMe = true) {
    // Remember me on -> persists across browser restarts. Off -> cleared when the tab/browser closes.
    await setPersistence($auth as any, rememberMe ? browserLocalPersistence : browserSessionPersistence)
    const cred = await signInWithEmailAndPassword($auth as any, email, password)
    return cred.user
  }

  async function register(email: string, password: string) {
    const cred = await createUserWithEmailAndPassword($auth as any, email, password)
    return cred.user
  }

  async function resetPassword(email: string) {
    await sendPasswordResetEmail($auth as any, email)
  }

  async function logout() {
    await signOut($auth as any)
  }

  return { currentUser, authReady, authReadyPromise, isAdmin, login, register, resetPassword, logout }
}
