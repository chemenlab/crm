import { useState, useEffect } from 'react'
import axios from 'axios'

export function useNotifications() {
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)

  const fetchUnreadCount = async () => {
    try {
      const response = await axios.get('/api/notifications/unread-count')
      setUnreadCount(response.data.count)
    } catch (error) {
      console.error('Failed to fetch unread count:', error)
    }
  }

  useEffect(() => {
    fetchUnreadCount()
    
    // Poll every 30 seconds for new notifications
    const interval = setInterval(fetchUnreadCount, 30000)
    
    return () => clearInterval(interval)
  }, [])

  return {
    unreadCount,
    loading,
    refreshCount: fetchUnreadCount
  }
}
