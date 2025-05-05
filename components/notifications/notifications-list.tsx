"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { formatDistanceToNow } from "date-fns";
import { Bell, Check, Trash2, RefreshCcw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "../ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { EmptyState } from "../ui/empty-state";
import { Pagination } from "../ui/pagination";
import { Spinner } from "../ui/spinner";
import { Badge } from "../ui/badge";

import { 
  getUserNotificationsAction,
  markNotificationAsReadAction,
  markAllNotificationsAsReadAction,
  deleteNotificationAction
} from "../../actions/notifications";

// Define NotificationType enum
type NotificationType = 'ORDER_STATUS_CHANGE' | 'PICKUP_READY' | 'ORDER_PICKED_UP' | 
  'RETURN_REQUESTED' | 'RETURN_APPROVED' | 'RETURN_REJECTED' | 'REFUND_PROCESSED';

// Define Notification interface
interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  is_read: boolean;
  created_at: string;
  order_id?: string | null;
  return_id?: string | null;
  reference_url?: string | null;
}

export function NotificationsList() {
  // State for notifications data
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [isPending, startTransition] = useTransition();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(10);

  // Function to fetch notifications
  const fetchNotifications = useCallback(async (page = 1, unreadOnly = false) => {
    setLoading(true);
    setError(null);
    
    try {
      const options = { 
        page, 
        limit: itemsPerPage,
        unreadOnly 
      };
      
      const result = await getUserNotificationsAction(options);
      
      if ('error' in result) {
        setError(result.error || "An unknown error occurred");
        
        // Handle auth error specifically
        if (result.error === "You must be signed in to view notifications") {
          toast.error("Please sign in to view notifications");
        }
        
        return;
      }
      
      setNotifications(result.data || []);
      
      // Update pagination
      if (result.meta) {
        setTotalPages(result.meta.pageCount || 1);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
      setError("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, [itemsPerPage]);

  // Handle tab change
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setCurrentPage(1); // Reset to page 1 when changing tabs
    fetchNotifications(1, tab === "unread");
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchNotifications(page, activeTab === "unread");
  };

  // Function to handle marking a notification as read
  const handleMarkAsRead = useCallback((id: string) => {
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("notificationId", id);
        
        const result = await markNotificationAsReadAction(formData);
        
        if (result.error) {
          toast.error(result.error);
          return;
        }
        
        // Update local state
        setNotifications(prevNotifications => 
          prevNotifications.map(notification => 
            notification.id === id 
              ? { ...notification, is_read: true } 
              : notification
          )
        );
        
        toast.success("Notification marked as read");
      } catch (error) {
        console.error("Error marking notification as read:", error);
        toast.error("Failed to mark notification as read");
      }
    });
  }, []);

  // Function to handle marking all notifications as read
  const handleMarkAllAsRead = useCallback(() => {
    startTransition(async () => {
      try {
        const result = await markAllNotificationsAsReadAction();
        
        if (result.error) {
          toast.error(result.error);
          return;
        }
        
        // Update local state
        setNotifications(prevNotifications => 
          prevNotifications.map(notification => ({
            ...notification,
            is_read: true
          }))
        );
        
        toast.success("All notifications marked as read");
        
        // Refresh the list if we're viewing unread only
        if (activeTab === "unread") {
          fetchNotifications(1, true);
        }
      } catch (error) {
        console.error("Error marking all notifications as read:", error);
        toast.error("Failed to mark all notifications as read");
      }
    });
  }, [activeTab, fetchNotifications]);

  // Function to handle deleting a notification
  const handleDelete = useCallback((id: string) => {
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("notificationId", id);
        
        const result = await deleteNotificationAction(formData);
        
        if (result.error) {
          toast.error(result.error);
          return;
        }
        
        // Update local state
        setNotifications(prevNotifications => 
          prevNotifications.filter(notification => notification.id !== id)
        );
        
        toast.success("Notification deleted");
      } catch (error) {
        console.error("Error deleting notification:", error);
        toast.error("Failed to delete notification");
      }
    });
  }, []);

  // Function to refresh notifications
  const handleRefresh = useCallback(() => {
    fetchNotifications(currentPage, activeTab === "unread");
    toast.success("Notifications refreshed");
  }, [fetchNotifications, currentPage, activeTab]);

  // Initial fetch on component mount
  useEffect(() => {
    fetchNotifications(1, false);
  }, [fetchNotifications]);

  // Helper function to format time
  const formatTime = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };

  // Helper function to get type label
  const getTypeLabel = (type: NotificationType) => {
    switch (type) {
      case 'ORDER_STATUS_CHANGE': return 'Order Status';
      case 'PICKUP_READY': return 'Pickup Ready';
      case 'ORDER_PICKED_UP': return 'Order Picked Up';
      case 'RETURN_REQUESTED': return 'Return Request';
      case 'RETURN_APPROVED': return 'Return Approved';
      case 'RETURN_REJECTED': return 'Return Rejected';
      case 'REFUND_PROCESSED': return 'Refund';
      default: return 'Notification';
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList>
            <TabsTrigger value="all">All Notifications</TabsTrigger>
            <TabsTrigger value="unread">Unread</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="flex flex-col xs:flex-row gap-2">
          {/* Mark All as Read button */}
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleMarkAllAsRead}
            disabled={isPending || notifications.every(n => n.is_read)}
            className="text-xs sm:text-sm whitespace-nowrap"
          >
            <Check className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
            Mark All as Read
          </Button>
          
          {/* Refresh button */}
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleRefresh}
            disabled={isPending || loading}
            className="text-xs sm:text-sm whitespace-nowrap"
          >
            <RefreshCcw className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
            Refresh
          </Button>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-50 text-red-700 p-4 mb-6 rounded-md">
          <p>{error}</p>
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center py-8">
          <Spinner size="lg" />
        </div>
      ) : notifications.length > 0 ? (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <Card 
              key={notification.id}
              className={notification.is_read ? "" : "border-l-4 border-primary"}
            >
              <CardHeader className="p-4 pb-2 flex flex-row justify-between items-start flex-wrap gap-2">
                <div className="max-w-full overflow-hidden">
                  <div className="font-semibold text-sm md:text-base truncate">{notification.title}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                    <span className="whitespace-nowrap">{getTypeLabel(notification.type)}</span>
                    <span className="hidden xs:inline">•</span>
                    <span className="whitespace-nowrap">{formatTime(notification.created_at)}</span>
                    {!notification.is_read && (
                      <>
                        <span className="hidden xs:inline">•</span>
                        <Badge variant="secondary" className="px-2 py-0 h-5">New</Badge>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  {!notification.is_read && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => handleMarkAsRead(notification.id)}
                      disabled={isPending}
                    >
                      <Check className="h-4 w-4" />
                      <span className="sr-only">Mark as read</span>
                    </Button>
                  )}
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(notification.id)}
                    disabled={isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete</span>
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="p-4 pt-2">
                <p className="text-sm break-words">{notification.message}</p>
              </CardContent>
              
              {notification.reference_url && (
                <CardFooter className="p-4 pt-0">
                  <Button 
                    variant="link" 
                    className="p-0 h-auto text-sm" 
                    asChild
                  >
                    <a href={notification.reference_url} className="truncate max-w-full">View details</a>
                  </Button>
                </CardFooter>
              )}
            </Card>
          ))}
          
          {totalPages > 1 && (
            <div className="flex justify-center mt-6">
              <Pagination 
                currentPage={currentPage} 
                totalPages={totalPages} 
                onPageChange={handlePageChange} 
              />
            </div>
          )}
        </div>
      ) : (
        <EmptyState
          title="No notifications"
          description={activeTab === "unread" 
            ? "You have no unread notifications" 
            : "You don't have any notifications yet"}
          icon={<Bell className="h-12 w-12" />}
        />
      )}
    </div>
  );
} 