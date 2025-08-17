"use client"

import React, { useEffect, useState, useCallback, useMemo } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Check, ArrowRight, Settings, Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import { toast } from "sonner"

import { cn } from "../../lib/utils"
import { Button } from "./button"
import { ScrollArea } from "./scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs"
import { Badge } from "./badge"
import { Separator } from "./separator"
import { NotificationItem } from "./notification-item"
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

interface NotificationDropdownProps {
  isOpen: boolean
  onClose: () => void
  className?: string
  maxHeight?: string
  limit?: number
  showTabs?: boolean
  showMarkAllRead?: boolean
  showSettings?: boolean
  onNotificationClick?: (notification: Notification) => void
}

export function NotificationDropdown({ 
  isOpen, 
  onClose, 
  className,
  maxHeight = "400px",
  limit = 10,
  showTabs = true,
  showMarkAllRead = true,
  showSettings = true,
  onNotificationClick
}: NotificationDropdownProps) {
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
  
  const [activeTab, setActiveTab] = useState("all")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Memoized computed values
  const notifications = useMemo(() => {
    return allNotifications.slice(0, limit)
  }, [allNotifications, limit])

  const unreadNotifications = useMemo(() => {
    return allNotifications.filter(n => !n.is_read).slice(0, limit)
  }, [allNotifications, limit])

  // Fetch notifications when dropdown opens (only if not connected or no data)
  useEffect(() => {
    if (isOpen && (!isConnected || allNotifications.length === 0)) {
      fetchNotifications()
    }
  }, [isOpen, isConnected, allNotifications.length, fetchNotifications])

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
    
    // Call custom click handler if provided
    if (onNotificationClick) {
      onNotificationClick(notification)
    } else {
      // Default behavior: navigate to reference URL if available
      if (notification.reference_url) {
        router.push(notification.reference_url)
        onClose()
      }
    }
  }

  // Format relative time
  const formatTime = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true })
  }

  // Get notification type label
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'ORDER_STATUS_CHANGE': return 'Order'
      case 'PICKUP_READY': return 'Pickup'
      case 'ORDER_PICKED_UP': return 'Pickup'
      case 'RETURN_REQUESTED': return 'Return'
      case 'RETURN_APPROVED': return 'Return'
      case 'RETURN_REJECTED': return 'Return'
      case 'REFUND_PROCESSED': return 'Refund'
      case 'PAYMENT_FAILED': return 'Payment'
      case 'NEW_ORDER_VENDOR': return 'Order'
      case 'PAYOUT_PROCESSED': return 'Payout'
      case 'LOW_STOCK_ALERT': return 'Stock'
      case 'NEW_PICKUP_ASSIGNMENT': return 'Assignment'
      default: return 'Update'
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 z-40 lg:hidden"
            onClick={onClose}
          />
          
          {/* Dropdown Panel */}
          <motion.div
            initial={{ opacity: 0, y: -5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "absolute right-0 z-50 mt-2 w-80 md:w-96 origin-top-right rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none",
              className
            )}
          >
            <div className="p-4">
              {/* Header */}
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
                  {showMarkAllRead && unreadNotifications.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleMarkAllAsRead}
                      disabled={isSubmitting}
                      className="text-xs h-8"
                    >
                      {isSubmitting ? (
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      ) : (
                        <Check className="h-3 w-3 mr-1" />
                      )}
                      Mark all read
                    </Button>
                  )}
                  
                  {/* Settings Link */}
                  {showSettings && (
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
                  )}
                </div>
              </div>
              
              {/* Error State */}
              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md mb-4">
                  {error}
                </div>
              )}
              
              {/* Loading State */}
              {isLoading ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <>
                  {/* Tabs */}
                  {showTabs ? (
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
                      <TabsList className="w-full grid grid-cols-2 mb-3">
                        <TabsTrigger value="all" className="text-sm">
                          All
                          {notifications.length > 0 && (
                            <Badge variant="secondary" className="ml-1 text-xs">
                              {notifications.length}
                            </Badge>
                          )}
                        </TabsTrigger>
                        <TabsTrigger value="unread" className="text-sm">
                          Unread
                          {unreadNotifications.length > 0 && (
                            <Badge variant="secondary" className="ml-1 text-xs">
                              {unreadNotifications.length}
                            </Badge>
                          )}
                        </TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="all" className="mt-0">
                        <ScrollArea style={{ height: maxHeight }} className="pr-4">
                          <div className="space-y-2">
                            {notifications.length > 0 ? (
                              notifications.map((notification, index) => (
                                <div key={notification.id}>
                                  <NotificationItem
                                    notification={notification}
                                    onClick={handleNotificationClick}
                                    onMarkAsRead={handleMarkAsRead}
                                    formatTime={formatTime}
                                    getTypeLabel={getTypeLabel}
                                  />
                                  {index < notifications.length - 1 && (
                                    <Separator className="my-2" />
                                  )}
                                </div>
                              ))
                            ) : (
                              <div className="text-center py-8 text-muted-foreground">
                                <div className="text-sm">No notifications yet</div>
                              </div>
                            )}
                          </div>
                        </ScrollArea>
                      </TabsContent>
                      
                      <TabsContent value="unread" className="mt-0">
                        <ScrollArea style={{ height: maxHeight }} className="pr-4">
                          <div className="space-y-2">
                            {unreadNotifications.length > 0 ? (
                              unreadNotifications.map((notification, index) => (
                                <div key={notification.id}>
                                  <NotificationItem
                                    notification={notification}
                                    onClick={handleNotificationClick}
                                    onMarkAsRead={handleMarkAsRead}
                                    formatTime={formatTime}
                                    getTypeLabel={getTypeLabel}
                                  />
                                  {index < unreadNotifications.length - 1 && (
                                    <Separator className="my-2" />
                                  )}
                                </div>
                              ))
                            ) : (
                              <div className="text-center py-8 text-muted-foreground">
                                <div className="text-sm">No unread notifications</div>
                              </div>
                            )}
                          </div>
                        </ScrollArea>
                      </TabsContent>
                    </Tabs>
                  ) : (
                    /* No Tabs - Show All Notifications */
                    <ScrollArea style={{ height: maxHeight }} className="pr-4">
                      <div className="space-y-2">
                        {notifications.length > 0 ? (
                          notifications.map((notification, index) => (
                            <div key={notification.id}>
                              <NotificationItem
                                notification={notification}
                                onClick={handleNotificationClick}
                                onMarkAsRead={handleMarkAsRead}
                                formatTime={formatTime}
                                getTypeLabel={getTypeLabel}
                              />
                              {index < notifications.length - 1 && (
                                <Separator className="my-2" />
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            <div className="text-sm">No notifications yet</div>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  )}
                </>
              )}
              
              {/* View All Link */}
              <Separator className="my-3" />
              <Button variant="link" className="w-full" asChild>
                <Link href="/notifications" className="flex items-center justify-center" onClick={onClose}>
                  View all notifications
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
