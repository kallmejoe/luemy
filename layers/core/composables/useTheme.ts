export const useTheme = () => {
  const isDark = ref(false)
  const isInitialized = ref(false)

  const setTheme = (dark: boolean) => {
    isDark.value = dark
    if (import.meta.client) {
      const htmlElement = document.documentElement
      if (dark) {
        htmlElement.classList.add("dark")
      } else {
        htmlElement.classList.remove("dark")
      }
      localStorage.setItem("theme", dark ? "dark" : "light")
    }
  }

  const detectSystemTheme = (): boolean => {
    if (import.meta.client && window.matchMedia) {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
    }
    return false
  }

  const initializeTheme = () => {
    if (isInitialized.value) return

    if (import.meta.client) {
      // Check localStorage first
      const savedTheme = localStorage.getItem("theme")
      if (savedTheme) {
        setTheme(savedTheme === "dark")
      } else {
        // Fall back to system preference
        const systemDark = detectSystemTheme()
        setTheme(systemDark)
      }
    }

    isInitialized.value = true
  }

  const toggleTheme = () => {
    setTheme(!isDark.value)
  }

  // Watch for system theme changes
  const watchSystemTheme = () => {
    if (import.meta.client && window.matchMedia) {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
      const handleChange = (e: MediaQueryListEvent) => {
        // Only apply system preference if no manual override is set
        if (!localStorage.getItem("theme")) {
          setTheme(e.matches)
        }
      }
      mediaQuery.addEventListener("change", handleChange)
      return () => mediaQuery.removeEventListener("change", handleChange)
    }
  }

  onMounted(() => {
    initializeTheme()
    watchSystemTheme()
  })

  return {
    isDark: readonly(isDark),
    isInitialized: readonly(isInitialized),
    setTheme,
    toggleTheme,
    detectSystemTheme,
    initializeTheme,
  }
}
