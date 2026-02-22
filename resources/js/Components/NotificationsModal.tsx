import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/Components/ui/dialog"
import { ScrollArea } from "@/Components/ui/scroll-area"
import { Badge } from "@/Components/ui/badge"
import { Button } from "@/Components/ui/button"
import { Calendar, Clock, User, CheckCheck, Trash2 } from "lucide-react"
import { useState, useEffect } from "react"
import { router } from "@inertiajs/react"
import axios from "axios"
import { toast } from "sonner"

interface Notification {
  id: number
  type: string
  data: {
    appointment_id: number
    client_name: string
    service_name: string
    date: string
    time: string
  }
  read_at: string | null
  created_at: string
}

interface NotificationsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function NotificationsModal({ isOpen, onClose }: NotificationsModalProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchNotifications()
    }
  }, [isOpen])

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const response = await axios.get('/api/notifications')
      // Ensure we always set an array
      const data = Array.isArray(response.data) ? response.data : []
      setNotifications(data)
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: number) => {
    try {
      await axios.post(`/api/notifications/${notificationId}/read`)
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read_at: new Date().toISOString() } : n)
      )
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      await axios.post('/api/notifications/read-all')
      setNotifications(prev => prev.map(n => ({ ...n, read_at: new Date().toISOString() })))
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
  }

  const deleteAllNotifications = async () => {
    try {
      await axios.delete('/api/notifications/delete-all')
      setNotifications([])
      toast.success('Все уведомления удалены')
      onClose()
    } catch (error) {
      console.error('Failed to delete all notifications:', error)
      toast.error('Не удалось удалить уведомления')
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id)
    // Open calendar and trigger appointment edit
    const appointmentDate = notification.data.date.split('.').reverse().join('-') // Convert DD.MM.YYYY to YYYY-MM-DD
    router.visit(`/app/calendar?date=${appointmentDate}&appointment=${notification.data.appointment_id}`)
    onClose()
  }

  const unreadCount = notifications.filter(n => !n.read_at).length

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              Уведомления
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unreadCount}
                </Badge>
              )}
            </DialogTitle>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-xs"
                >
                  <CheckCheck className="h-4 w-4 mr-1" />
                  Прочитать все
                </Button>
              )}
              {notifications.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={deleteAllNotifications}
                  className="text-xs text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Очистить
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="h-[500px] pr-4">
          {loading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              Загрузка...
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <CheckCheck className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">Нет новых уведомлений</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`
                    p-4 rounded-lg border cursor-pointer transition-all hover:bg-accent
                    ${!notification.read_at ? 'bg-primary/5 border-primary/20' : 'bg-card'}
                  `}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">Новая запись онлайн</h4>
                        {!notification.read_at && (
                          <Badge variant="default" className="text-xs">
                            Новое
                          </Badge>
                        )}
                      </div>
                      
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span>{notification.data.client_name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>{notification.data.service_name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>{notification.data.date} в {notification.data.time}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(notification.created_at).toLocaleString('ru-RU', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
