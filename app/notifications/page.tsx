import { Suspense } from "react";
import Link from "next/link";
import { Settings } from "lucide-react";
import { PageWrapper } from "../../components/layout/page-wrapper";
import { PageHeading } from "../../components/ui/page-heading";
import { NotificationsList } from "../../components/notifications/notifications-list";
import { NotificationsListSkeleton } from "../../components/notifications/notifications-list-skeleton";
import { Button } from "../../components/ui/button";

export const metadata = {
  title: "Notifications | Zervia",
  description: "View and manage your notifications from Zervia",
};

export default function NotificationsPage() {
  return (
    <PageWrapper>
      <div className="flex items-center justify-between">
        <PageHeading 
          title="Notifications" 
          description="View and manage your notifications"
        />
        <Button variant="outline" size="sm" asChild>
          <Link href="/notifications/preferences" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span>Preferences</span>
          </Link>
        </Button>
      </div>
      
      <div className="mt-6">
        <Suspense fallback={<NotificationsListSkeleton />}>
          <NotificationsList />
        </Suspense>
      </div>
    </PageWrapper>
  );
} 