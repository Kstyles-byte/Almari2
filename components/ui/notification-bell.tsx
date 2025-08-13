"use client"

import React, { useEffect, useState } from "react"
import { Bell, WifiOff, Wifi } from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "../../lib/utils"
import { Button } from "./button"
import { useNotificationContext } from "../../contexts/NotificationContext"

interface NotificationBellProps {
  className?: string
  size?: "sm" | "md" | "lg"
  variant?: "default" | "ghost" | "outline"
  showBadge?: boolean
  showConnectionStatus?: boolean
  onClick?: () => void
}

export function NotificationBell({ 
  className, 
  size = "md", 
  variant = "ghost",
  showBadge = true,
  showConnectionStatus = false,
  onClick
}: NotificationBellProps) {
  const { 
    unreadCount, 
    loading, 
    isConnected, 
    refreshCount,
    reconnect 
  } = useNotificationContext()

  // Handle manual refresh (for cases where real-time might miss updates)
  const handleRefresh = () => {
    if (!isConnected) {
      reconnect()
    } else {
      refreshCount()
    }
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
          !isConnected && "opacity-70",
          className
        )}
        onClick={onClick || handleRefresh}
        disabled={loading}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}${!isConnected ? ' (disconnected)' : ''}`}
      >
        <motion.div
          animate={loading ? { rotate: 360 } : {}}
          transition={{ duration: 1, repeat: loading ? Infinity : 0, ease: "linear" }}
        >
          <Bell className={config.iconSize} />
        </motion.div>
        
        {/* Connection status indicator */}
        {showConnectionStatus && (
          <div className={cn(
            "absolute -bottom-1 -right-1 rounded-full p-0.5",
            isConnected ? "bg-green-500" : "bg-red-500"
          )}>
            {isConnected ? (
              <Wifi className="h-2 w-2 text-white" />
            ) : (
              <WifiOff className="h-2 w-2 text-white" />
            )}
          </div>
        )}
        
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
