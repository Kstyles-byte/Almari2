"use client"

import React from "react"
import { Check, Dot, Package, CreditCard, AlertTriangle, ShoppingCart, DollarSign, Inbox, UserCheck } from "lucide-react"
import { motion } from "framer-motion"

import { cn } from "../../lib/utils"
import { Button } from "./button"
import { Badge } from "./badge"

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

interface NotificationItemProps {
  notification: Notification
  onClick?: (notification: Notification) => void
  onMarkAsRead?: (id: string, e?: React.MouseEvent) => void
  formatTime?: (dateString: string) => string
  getTypeLabel?: (type: string) => string
  className?: string
  showMarkAsReadButton?: boolean
  showIcon?: boolean
  showBadge?: boolean
  variant?: "default" | "compact" | "detailed"
}

// Get icon for notification type
function getNotificationIcon(type: string) {
  switch (type) {
    case 'ORDER_STATUS_CHANGE':
    case 'NEW_ORDER_VENDOR':
      return Package
    case 'PICKUP_READY':
    case 'ORDER_PICKED_UP':
    case 'NEW_PICKUP_ASSIGNMENT':
      return UserCheck
    case 'RETURN_REQUESTED':
    case 'RETURN_APPROVED':
    case 'RETURN_REJECTED':
      return Package
    case 'REFUND_PROCESSED':
    case 'PAYOUT_PROCESSED':
      return DollarSign
    case 'PAYMENT_FAILED':
      return CreditCard
    case 'LOW_STOCK_ALERT':
      return AlertTriangle
    default:
      return Inbox
  }
}

// Get notification type color
function getNotificationColor(type: string) {
  switch (type) {
    case 'ORDER_STATUS_CHANGE':
    case 'NEW_ORDER_VENDOR':
      return 'text-blue-500'
    case 'PICKUP_READY':
    case 'ORDER_PICKED_UP':
    case 'NEW_PICKUP_ASSIGNMENT':
      return 'text-green-500'
    case 'RETURN_REQUESTED':
    case 'RETURN_APPROVED':
      return 'text-orange-500'
    case 'RETURN_REJECTED':
      return 'text-red-500'
    case 'REFUND_PROCESSED':
    case 'PAYOUT_PROCESSED':
      return 'text-emerald-500'
    case 'PAYMENT_FAILED':
      return 'text-red-500'
    case 'LOW_STOCK_ALERT':
      return 'text-amber-500'
    default:
      return 'text-gray-500'
  }
}

// Get notification priority (for sorting/styling)
function getNotificationPriority(type: string): 'high' | 'medium' | 'low' {
  switch (type) {
    case 'PAYMENT_FAILED':
    case 'LOW_STOCK_ALERT':
    case 'RETURN_REJECTED':
      return 'high'
    case 'PICKUP_READY':
    case 'NEW_ORDER_VENDOR':
    case 'NEW_PICKUP_ASSIGNMENT':
    case 'RETURN_REQUESTED':
      return 'medium'
    default:
      return 'low'
  }
}

export function NotificationItem({
  notification,
  onClick,
  onMarkAsRead,
  formatTime,
  getTypeLabel,
  className,
  showMarkAsReadButton = true,
  showIcon = true,
  showBadge = true,
  variant = "default"
}: NotificationItemProps) {
  const Icon = showIcon ? getNotificationIcon(notification.type) : null
  const iconColor = getNotificationColor(notification.type)
  const priority = getNotificationPriority(notification.type)
  const typeLabel = getTypeLabel ? getTypeLabel(notification.type) : notification.type
  const timeFormatted = formatTime ? formatTime(notification.created_at) : new Date(notification.created_at).toLocaleDateString()

  const handleClick = () => {
    if (onClick) {
      onClick(notification)
    }
  }

  const handleMarkAsRead = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onMarkAsRead) {
      onMarkAsRead(notification.id, e)
    }
  }

  // Variant-specific styling
  const getVariantClasses = () => {
    switch (variant) {
      case "compact":
        return "p-2 text-sm"
      case "detailed":
        return "p-4"
      default:
        return "p-3"
    }
  }

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        "rounded-lg relative cursor-pointer transition-all duration-200 hover:shadow-sm",
        getVariantClasses(),
        // Read/unread styling
        notification.is_read 
          ? "bg-muted/30 hover:bg-muted/50" 
          : "bg-background border hover:bg-muted/30",
        // Priority styling
        !notification.is_read && priority === 'high' && "border-l-4 border-l-red-500",
        !notification.is_read && priority === 'medium' && "border-l-4 border-l-yellow-500",
        className
      )}
      onClick={handleClick}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        {Icon && showIcon && (
          <div className={cn(
            "flex-shrink-0 mt-0.5",
            iconColor,
            variant === "compact" ? "h-4 w-4" : "h-5 w-5"
          )}>
            <Icon className="h-full w-full" />
          </div>
        )}
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className={cn(
              "font-medium truncate",
              notification.is_read ? "text-muted-foreground" : "text-foreground",
              variant === "compact" ? "text-sm" : "text-base"
            )}>
              {notification.title}
            </h4>
            
            {/* Unread indicator */}
            {!notification.is_read && (
              <div className="flex-shrink-0">
                <Dot className="h-4 w-4 text-blue-500 fill-current" />
              </div>
            )}
          </div>
          
          {/* Message */}
          <p className={cn(
            "text-muted-foreground leading-relaxed",
            variant === "compact" ? "text-xs line-clamp-1" : variant === "detailed" ? "text-sm" : "text-sm line-clamp-2"
          )}>
            {notification.message}
          </p>
          
          {/* Footer */}
          <div className={cn(
            "flex items-center justify-between mt-2",
            variant === "compact" ? "mt-1" : "mt-2"
          )}>
            <div className="flex items-center gap-2">
              {/* Type badge */}
              {showBadge && (
                <Badge 
                  variant="secondary" 
                  className={cn(
                    "text-xs",
                    variant === "compact" && "text-[10px] px-1.5 py-0.5"
                  )}
                >
                  {typeLabel}
                </Badge>
              )}
              
              {/* Time */}
              <span className={cn(
                "text-muted-foreground",
                variant === "compact" ? "text-[10px]" : "text-xs"
              )}>
                {timeFormatted}
              </span>
            </div>
            
            {/* Mark as read button */}
            {!notification.is_read && showMarkAsReadButton && (
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity",
                  variant === "compact" ? "h-5 w-5" : "h-6 w-6"
                )}
                onClick={handleMarkAsRead}
                aria-label="Mark as read"
              >
                <Check className={cn(
                  variant === "compact" ? "h-3 w-3" : "h-4 w-4"
                )} />
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* Hover overlay for better interaction feedback */}
      <div className="absolute inset-0 rounded-lg opacity-0 hover:opacity-5 bg-foreground transition-opacity pointer-events-none" />
    </motion.div>
  )
}

// Memoized version for performance
export const MemoizedNotificationItem = React.memo(NotificationItem)
