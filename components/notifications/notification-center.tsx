"use client"

import * as React from "react"
import { Bell } from "lucide-react"
import { AnimatePresence, motion } from "framer-motion"

import { cn } from "../../lib/utils"
import { Button } from "../ui/button"
import { ScrollArea } from "../ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { EmptyState } from "../ui/empty-state"
import { Badge } from "../ui/badge"

interface Notification {
  id: string
  title: string
  message: string
  time: string
  read: boolean
  type: "order" | "system" | "account" | "promotion"
}

interface NotificationCenterProps {
  notifications?: Notification[]
  onMarkAllAsRead?: () => void
  onReadNotification?: (id: string) => void
  className?: string
}

export function NotificationCenter({
  notifications = [],
  onMarkAllAsRead,
  onReadNotification,
  className
}: NotificationCenterProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  
  // Count unread notifications
  const unreadCount = notifications.filter(notification => !notification.read).length
  
  // Group notifications by type
  const orderNotifications = notifications.filter(notification => notification.type === "order")
  const systemNotifications = notifications.filter(notification => notification.type === "system")
  const accountNotifications = notifications.filter(notification => notification.type === "account")
  const promotionNotifications = notifications.filter(notification => notification.type === "promotion")

  return (
    <div className={cn("relative", className)}>
      <Button 
        variant="ghost" 
        size="icon" 
        className="rounded-full relative"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive"
            className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-[10px]"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-12 z-50 w-80 md:w-96 rounded-md border bg-card p-4 shadow-md"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Notifications</h3>
              {unreadCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-xs h-8"
                  onClick={onMarkAllAsRead}
                >
                  Mark all as read
                </Button>
              )}
            </div>
            
            <Tabs defaultValue="all">
              <TabsList className="w-full mb-4 h-9">
                <TabsTrigger value="all" className="flex-1">
                  All {notifications.length > 0 && `(${notifications.length})`}
                </TabsTrigger>
                <TabsTrigger value="order" className="flex-1">
                  Orders {orderNotifications.length > 0 && `(${orderNotifications.length})`}
                </TabsTrigger>
                <TabsTrigger value="system" className="flex-1">
                  System
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="all">
                {notifications.length > 0 ? (
                  <NotificationList 
                    notifications={notifications} 
                    onReadNotification={onReadNotification} 
                  />
                ) : (
                  <EmptyState
                    title="No notifications"
                    description="You don't have any notifications yet."
                    icon={<Bell className="h-8 w-8 text-muted-foreground" />}
                    size="sm"
                  />
                )}
              </TabsContent>
              
              <TabsContent value="order">
                {orderNotifications.length > 0 ? (
                  <NotificationList 
                    notifications={orderNotifications} 
                    onReadNotification={onReadNotification} 
                  />
                ) : (
                  <EmptyState
                    title="No order notifications"
                    description="You don't have any order notifications yet."
                    icon={<Bell className="h-8 w-8 text-muted-foreground" />}
                    size="sm"
                  />
                )}
              </TabsContent>
              
              <TabsContent value="system">
                {systemNotifications.length > 0 ? (
                  <NotificationList 
                    notifications={systemNotifications} 
                    onReadNotification={onReadNotification} 
                  />
                ) : (
                  <EmptyState
                    title="No system notifications"
                    description="You don't have any system notifications yet."
                    icon={<Bell className="h-8 w-8 text-muted-foreground" />}
                    size="sm"
                  />
                )}
              </TabsContent>
            </Tabs>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

interface NotificationListProps {
  notifications: Notification[]
  onReadNotification?: (id: string) => void
}

function NotificationList({ notifications, onReadNotification }: NotificationListProps) {
  return (
    <ScrollArea className="h-[300px] pr-4">
      <div className="space-y-3">
        {notifications.map((notification) => (
          <div 
            key={notification.id}
            className={cn(
              "rounded-lg p-3 text-sm relative",
              notification.read ? "bg-muted/50" : "bg-muted border-l-4 border-primary"
            )}
            onClick={() => onReadNotification?.(notification.id)}
          >
            <div className="font-medium">{notification.title}</div>
            <div className="text-muted-foreground mt-1">{notification.message}</div>
            <div className="text-xs text-muted-foreground mt-2">{notification.time}</div>
          </div>
        ))}
      </div>
    </ScrollArea>
  )
} 