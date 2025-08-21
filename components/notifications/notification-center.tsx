"use client"

import { useEffect, useState, useMemo } from "react"
import { Bell, Check, ArrowRight, Settings } from "lucide-react"
import { AnimatePresence, motion } from "framer-motion"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { useAtom } from "jotai"
import { atomWithStorage } from "jotai/utils"

import { cn } from "../../lib/utils"
import { Button } from "../ui/button"
import { ScrollArea } from "../ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { EmptyState } from "../ui/empty-state"
import { Badge } from "../ui/badge"
import { Spinner } from "../ui/spinner"
import { useNotificationContext } from "../../contexts/NotificationContext"

// Notification interface
interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
  order_id?: string | null;
  return_id?: string | null;
  reference_url?: string | null;
}

// Interface for component props
interface NotificationCenterProps {
  className?: string;
}

// Create an atom for unread notifications state
export const userHasUnreadNotificationsAtom = atomWithStorage('userHasUnreadNotifications', false)

// The NotificationCenter component
export function NotificationCenter({ className }: NotificationCenterProps) {
  const router = useRouter()
  
  // Use notification context instead of local state and server actions
  const {
    notifications: allNotifications,
    unreadCount,
    loading: isLoading,
    error,
    markAsRead: contextMarkAsRead,
    markAllAsRead: contextMarkAllAsRead,
    fetchNotifications,
    isConnected
  } = useNotificationContext()

  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("all")
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Use Jotai for persistent state across components
  const [hasUnreadNotifications, setHasUnreadNotifications] = useAtom(userHasUnreadNotificationsAtom)

  // Memoized computed values
  const notifications = useMemo(() => {
    return allNotifications.slice(0, 10)
  }, [allNotifications])

  const unreadNotifications = useMemo(() => {
    return allNotifications.filter(n => !n.is_read).slice(0, 10)
  }, [allNotifications])

  // Update hasUnreadNotifications when unreadCount changes
  useEffect(() => {
    setHasUnreadNotifications(unreadCount > 0)
  }, [unreadCount, setHasUnreadNotifications])

  // Function to open and close the notification panel
  const toggleNotifications = () => {
    if (!isOpen && (!isConnected || allNotifications.length === 0)) {
      // Only fetch notifications when opening if not connected or no data
      fetchNotifications()
    }
    setIsOpen(!isOpen)
  }

  // Function to mark a notification as read
  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation() // Prevent notification click event
    }
    
    try {
      setIsSubmitting(true)
      await contextMarkAsRead(id)
      toast.success("Notification marked as read")
    } catch (error) {
      console.error("Error marking notification as read:", error)
      toast.error("Failed to mark notification as read")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Function to mark all notifications as read
  const handleMarkAllAsRead = async () => {
    try {
      setIsSubmitting(true)
      await contextMarkAllAsRead()
      toast.success("All notifications marked as read")
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
      toast.error("Failed to mark all notifications as read")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Function to handle notification click
  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      handleMarkAsRead(notification.id)
    }
    
    // Navigate to reference URL if available
    if (notification.reference_url) {
      router.push(notification.reference_url)
      setIsOpen(false)
    }
  }

  // Fetch notifications when dropdown opens (only if not connected or no data)
  useEffect(() => {
    if (isOpen && (!isConnected || allNotifications.length === 0)) {
      fetchNotifications()
    }
  }, [isOpen, isConnected, allNotifications.length, fetchNotifications])

  // Get notification type label
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'ORDER_STATUS_CHANGE': return 'Order Status'
      case 'PICKUP_READY': return 'Pickup Ready'
      case 'ORDER_PICKED_UP': return 'Order Picked Up'
      case 'RETURN_REQUESTED': return 'Return'
      case 'RETURN_APPROVED': return 'Return'
      case 'RETURN_REJECTED': return 'Return'
      case 'REFUND_PROCESSED': return 'Refund'
      default: return 'Notification'
    }
  }

  // Format relative time
  const formatTime = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true })
  }

  return (
    <div className="relative">
      {/* Notification Bell Button */}
      <button
        onClick={toggleNotifications}
        className={cn(
          "flex items-center justify-center h-10 w-10 rounded-full hover:bg-gray-100 transition-colors",
          "text-gray-700 hover:bg-gray-100",
          className
        )}
        aria-label="Open notifications"
      >
        <Bell className="h-5 w-5" />
        {hasUnreadNotifications && (
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />
        )}
      </button>
      
      {/* Notification Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 z-40 lg:hidden"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, y: -5, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -5, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 z-50 mt-2 w-80 md:w-96 origin-top-right rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold">Notifications</h2>
                    {/* Connection Status Indicator */}
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      isConnected ? "bg-green-500" : "bg-red-500"
                    )} title={isConnected ? "Connected" : "Disconnected"} />
                  </div>
                  
                  <div className="flex items-center gap-1">
                    {/* Mark All as Read Button */}
                    {unreadNotifications.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleMarkAllAsRead}
                        disabled={isSubmitting}
                        className="text-xs h-8"
                      >
                        {isSubmitting ? (
                          <Spinner className="h-3 w-3 mr-1" />
                        ) : (
                          <Check className="h-3 w-3 mr-1" />
                        )}
                        Mark all as read
                      </Button>
                    )}
                    
                    {/* Settings Link */}
                    <Button
                      variant="ghost"
                      size="icon"
                      asChild
                      className="h-8 w-8"
                    >
                      <Link href="/settings/notifications">
                        <Settings className="h-4 w-4" />
                        <span className="sr-only">Notification Settings</span>
                      </Link>
                    </Button>
                  </div>
                </div>
                
                {/* Debug Info */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="mb-2 p-2 bg-gray-100 rounded text-xs">
                    <div>Connected: {isConnected ? '✅' : '❌'}</div>
                    <div>All: {allNotifications.length}, Filtered: {notifications.length}</div>
                    <div>Unread: {unreadCount}</div>
                  </div>
                )}
                
                {/* Test Notification Button (Dev only) */}
                {process.env.NODE_ENV === 'development' && (
                  <Button
                    onClick={async () => {
                      try {
                        // Get current user ID from Supabase
                        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
                        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
                        
                        const { createBrowserClient } = await import('@supabase/ssr');
                        const supabase = createBrowserClient(supabaseUrl!, supabaseKey!);
                        const { data: { user } } = await supabase.auth.getUser();
                        
                        if (user) {
                          const response = await fetch('/api/test-notification', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              userId: user.id,
                              templateKey: 'ORDER_CONFIRMATION',
                              data: { orderId: `test-${Date.now()}` }
                            })
                          });
                          
                          if (response.ok) {
                            toast.success('Test notification created!');
                          } else {
                            toast.error('Failed to create test notification');
                          }
                        }
                      } catch (error) {
                        console.error('Test notification error:', error);
                        toast.error('Error creating test notification');
                      }
                    }}
                    className="w-full mb-2"
                    variant="outline"
                    size="sm"
                  >
                    🧪 Create Test Notification
                  </Button>
                )}

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
                  <TabsList className="w-full grid grid-cols-2 mb-2">
                    <TabsTrigger value="all">
                      All
                      {notifications.length > 0 && (
                        <Badge variant="secondary" className="ml-1">{notifications.length}</Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="unread">
                      Unread
                      {unreadNotifications.length > 0 && (
                        <Badge variant="secondary" className="ml-1">{unreadNotifications.length}</Badge>
                      )}
                    </TabsTrigger>
                  </TabsList>
                  
                  {error && (
                    <div className="p-4 text-sm text-red-500 bg-red-50 rounded-md mt-2">
                      {error}
                    </div>
                  )}
                  
                  {isLoading ? (
                    <div className="flex justify-center items-center py-8">
                      <Spinner size="lg" />
                    </div>
                  ) : (
                    <>
                      <TabsContent value="all" className="mt-0">
                        {notifications.length > 0 ? (
                          <NotificationList
                            notifications={notifications}
                            onNotificationClick={handleNotificationClick}
                            onMarkAsRead={handleMarkAsRead}
                            formatTime={formatTime}
                            getTypeLabel={getTypeLabel}
                          />
                        ) : (
                          <EmptyState
                            title="No notifications"
                            description="You don't have any notifications yet"
                            icon={<Bell className="h-8 w-8" />}
                            className="py-8"
                          />
                        )}
                      </TabsContent>
                      
                      <TabsContent value="unread" className="mt-0">
                        {unreadNotifications.length > 0 ? (
                          <NotificationList
                            notifications={unreadNotifications}
                            onNotificationClick={handleNotificationClick}
                            onMarkAsRead={handleMarkAsRead}
                            formatTime={formatTime}
                            getTypeLabel={getTypeLabel}
                          />
                        ) : (
                          <EmptyState
                            title="No unread notifications"
                            description="You have no unread notifications"
                            icon={<Bell className="h-8 w-8" />}
                            className="py-8"
                          />
                        )}
                      </TabsContent>
                    </>
                  )}
                </Tabs>
                
                {/* View All Link */}
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <Button variant="link" className="w-full" asChild>
                    <Link href="/notifications" className="flex items-center justify-center" onClick={() => setIsOpen(false)}>
                      View all notifications
                      <ArrowRight className="ml-1 h-3 w-3" />
                    </Link>
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

// Props for NotificationList component
interface NotificationListProps {
  notifications: Notification[];
  onNotificationClick: (notification: Notification) => void;
  onMarkAsRead: (id: string, e: React.MouseEvent) => void;
  formatTime: (dateString: string) => string;
  getTypeLabel: (type: string) => string;
}

// NotificationList subcomponent
function NotificationList({
  notifications,
  onNotificationClick,
  onMarkAsRead,
  formatTime,
  getTypeLabel
}: NotificationListProps) {
  return (
    <ScrollArea className="h-[300px] pr-4">
      <div className="space-y-3">
        {notifications.map((notification) => (
          <div 
            key={notification.id}
            className={cn(
              "rounded-lg p-3 text-sm relative cursor-pointer",
              notification.is_read ? "bg-muted/50" : "bg-muted border-l-4 border-primary"
            )}
            onClick={() => onNotificationClick(notification)}
          >
            <div className="font-medium">{notification.title}</div>
            <div className="text-muted-foreground mt-1">{notification.message}</div>
            <div className="text-xs text-muted-foreground mt-2 flex items-center justify-between">
              <span>{formatTime(notification.created_at)}</span>
              <span className="bg-muted-foreground/20 rounded-full px-2 py-0.5 text-[10px]">
                {getTypeLabel(notification.type)}
              </span>
            </div>
            
            {!notification.is_read && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 absolute top-2 right-2"
                onClick={(e) => onMarkAsRead(notification.id, e)}
              >
                <Check className="h-3 w-3" />
                <span className="sr-only">Mark as read</span>
              </Button>
            )}
          </div>
        ))}
      </div>
    </ScrollArea>
  )
} 