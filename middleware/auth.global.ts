export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) return // ssr: false app, but guard just in case

  // Public share links are read-only, unauthenticated pages for customers.
  if (to.path.startsWith('/share/')) return

  const publicPages = ['/login', '/register', '/forgot-password']
  const { currentUser, authReadyPromise } = useAuth()

  // Wait for Firebase's first auth callback so we don't redirect based on a
  // not-yet-populated currentUser on hard page loads.
  await authReadyPromise

  if (!currentUser.value && !publicPages.includes(to.path)) {
    return navigateTo('/login')
  }
  if (currentUser.value && publicPages.includes(to.path)) {
    return navigateTo('/')
  }
})
