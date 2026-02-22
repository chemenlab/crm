const SIDEBAR_COOKIE_NAME = 'sidebar_state'

function readSidebarCookie(): boolean {
  if (typeof document === 'undefined') return true
  
  const cookies = document.cookie.split(';')
  const sidebarCookie = cookies.find(cookie => 
    cookie.trim().startsWith(`${SIDEBAR_COOKIE_NAME}=`)
  )
  
  if (sidebarCookie) {
    const value = sidebarCookie.split('=')[1]
    return value === 'true'
  }
  
  return true // Default to open if no cookie
}

export function useSidebarState() {
  // Read cookie synchronously before first render
  return readSidebarCookie()
}
