"use client"

import React, { useEffect, useState } from "react"
import { Bell } from "lucide-react"
import { motion } from "framer-motion"
import { createClient } from '@supabase/supabase-js'
import { cn } from "../../lib/utils"
import { Button } from "./button"
import { getUnreadNotificationCountAction } from "../../actions/notifications"

// Create Supabase client for real-time subscriptions
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface NotificationBellProps {
  className?: string
  size?: "sm" | "md" | "lg"
  variant?: "default" | "ghost" | "outline"
  showBadge?: boolean
  onClick?: () => void
  userId?: string // Optional: if not provided, will get from Supabase auth
}

export function NotificationBell({ 
  className, 
  size = "md", 
  variant = "ghost",
  showBadge = true,
  onClick,
  userId 
}: NotificationBellProps) {
  const [unreadCount, setUnreadCount] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(userId || null)

  // Get current user if userId not provided
  useEffect(() => {
    if (!userId) {
      const getCurrentUser = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        setCurrentUserId(user?.id || null)
      }
      getCurrentUser()
    }
  }, [userId])

  // Fetch initial unread count
  const fetchUnreadCount = async () => {
    if (!currentUserId) return

    setIsLoading(true)
    try {
      const result = await getUnreadNotificationCountAction()
      
      if (!('error' in result) && result.success && typeof result.count === 'number') {
        setUnreadCount(result.count)
      }
    } catch (error) {
      console.error("Error fetching unread count:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Set up real-time subscription for notification changes
  useEffect(() => {
    if (!currentUserId) return

    fetchUnreadCount()

    // Subscribe to notification changes for this user
    const channel = supabase
      .channel('notification-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'Notification',
          filter: `user_id=eq.${currentUserId}`
        },
        (payload) => {
          console.log('Notification change detected:', payload)
          
          // Refetch count when notifications change
          fetchUnreadCount()
        }
      )
      .subscribe()

    // Cleanup subscription on unmount
    return () => {
      channel.unsubscribe()
    }
  }, [currentUserId])

  // Handle manual refresh (for cases where real-time might miss updates)
  const handleRefresh = () => {
    fetchUnreadCount()
  }

  // Size configurations
  const sizeConfig = {
    sm: {
      buttonSize: "h-8 w-8",
      iconSize: "h-4 w-4",
      badgeSize: "h-4 w-4 text-[10px]",
      badgePosition: "top-0 right-0"
    },
    md: {
      buttonSize: "h-10 w-10",
      iconSize: "h-5 w-5", 
      badgeSize: "h-5 w-5 text-xs",
      badgePosition: "top-0 right-0"
    },
    lg: {
      buttonSize: "h-12 w-12",
      iconSize: "h-6 w-6",
      badgeSize: "h-6 w-6 text-sm",
      badgePosition: "top-0 right-0"
    }
  }

  const config = sizeConfig[size]

  return (
    <div className="relative">
      <Button
        variant={variant}
        size="icon"
        className={cn(
          config.buttonSize,
          "relative transition-colors",
          className
        )}
        onClick={onClick || handleRefresh}
        disabled={isLoading}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <motion.div
          animate={isLoading ? { rotate: 360 } : {}}
          transition={{ duration: 1, repeat: isLoading ? Infinity : 0, ease: "linear" }}
        >
          <Bell className={config.iconSize} />
        </motion.div>
        
        {/* Unread count badge */}
        {showBadge && unreadCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className={cn(
              "absolute flex items-center justify-center rounded-full bg-red-500 text-white font-medium",
              config.badgeSize,
              config.badgePosition,
              "-translate-y-1 translate-x-1"
            )}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </motion.div>
        )}
        
        {/* Pulse animation for new notifications */}
        {unreadCount > 0 && (
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 0.8, 0.5]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className={cn(
              "absolute rounded-full bg-red-500/30",
              config.buttonSize,
              "pointer-events-none"
            )}
          />
        )}
      </Button>
    </div>
  )
}

// Memoized version for performance
export const MemoizedNotificationBell = React.memo(NotificationBell)
