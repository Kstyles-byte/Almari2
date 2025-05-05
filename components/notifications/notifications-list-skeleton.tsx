"use client";

import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Check, RefreshCcw } from "lucide-react";
import { Skeleton } from "../ui/skeleton";

export function NotificationsListSkeleton() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">All Notifications</TabsTrigger>
            <TabsTrigger value="unread">Unread</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled>
            <Check className="mr-2 h-4 w-4" />
            Mark All as Read
          </Button>
          
          <Button variant="outline" size="sm" disabled>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>
      
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index}>
            <CardHeader className="p-4 pb-2 flex flex-row justify-between items-start">
              <div className="w-full">
                <Skeleton className="h-5 w-1/3 mb-2" />
                <Skeleton className="h-3 w-1/4" />
              </div>
              <div className="flex gap-1">
                <Skeleton className="h-8 w-8 rounded-md" />
                <Skeleton className="h-8 w-8 rounded-md" />
              </div>
            </CardHeader>
            
            <CardContent className="p-4 pt-2">
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 