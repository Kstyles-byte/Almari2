"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";

import { PageWrapper } from "../../../components/layout/page-wrapper";
import { PageHeading } from "../../../components/ui/page-heading";
import { Button } from "../../../components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "../../../components/ui/card";
import { Switch } from "../../../components/ui/switch";
import { Label } from "../../../components/ui/label";

// Example notification preferences - this would eventually be saved to a backend
interface NotificationPreferences {
  orderUpdates: boolean;
  returnUpdates: boolean;
  marketingEmails: boolean;
  pushNotifications: boolean;
  emailNotifications: boolean;
}

export default function NotificationPreferencesPage() {
  const router = useRouter();
  
  // State for notification preferences
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    orderUpdates: true,
    returnUpdates: true,
    marketingEmails: false,
    pushNotifications: true,
    emailNotifications: true,
  });
  
  // State for tracking save operation
  const [isSaving, setIsSaving] = useState(false);
  
  // Function to handle preference toggle
  const handleToggle = (key: keyof NotificationPreferences) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };
  
  // Function to handle saving preferences
  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      // Simulate saving to backend
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success("Notification preferences saved successfully");
      router.push("/notifications");
    } catch (error) {
      console.error("Error saving notification preferences:", error);
      toast.error("Failed to save notification preferences");
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <PageWrapper>
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="sm" className="mr-4" asChild>
          <Link href="/notifications">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Notifications
          </Link>
        </Button>
      </div>
      
      <PageHeading 
        title="Notification Preferences" 
        description="Customize how you receive notifications from Zervia"
      />
      
      <div className="mt-6 space-y-6">
        {/* Notification Types */}
        <Card>
          <CardHeader>
            <CardTitle>Notification Types</CardTitle>
            <CardDescription>Choose which types of notifications you want to receive</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="order-updates" className="font-medium">Order Updates</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified about status changes to your orders
                </p>
              </div>
              <Switch 
                id="order-updates" 
                checked={preferences.orderUpdates}
                onCheckedChange={() => handleToggle('orderUpdates')}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="return-updates" className="font-medium">Return Updates</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified about status changes to your return requests
                </p>
              </div>
              <Switch 
                id="return-updates" 
                checked={preferences.returnUpdates}
                onCheckedChange={() => handleToggle('returnUpdates')}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="marketing-emails" className="font-medium">Marketing Emails</Label>
                <p className="text-sm text-muted-foreground">
                  Receive promotional emails and special offers
                </p>
              </div>
              <Switch 
                id="marketing-emails" 
                checked={preferences.marketingEmails}
                onCheckedChange={() => handleToggle('marketingEmails')}
              />
            </div>
          </CardContent>
        </Card>
        
        {/* Notification Channels */}
        <Card>
          <CardHeader>
            <CardTitle>Notification Channels</CardTitle>
            <CardDescription>Choose how you want to receive your notifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="push-notifications" className="font-medium">Push Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications in your browser or mobile app
                </p>
              </div>
              <Switch 
                id="push-notifications" 
                checked={preferences.pushNotifications}
                onCheckedChange={() => handleToggle('pushNotifications')}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email-notifications" className="font-medium">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications via email
                </p>
              </div>
              <Switch 
                id="email-notifications" 
                checked={preferences.emailNotifications}
                onCheckedChange={() => handleToggle('emailNotifications')}
              />
            </div>
          </CardContent>
        </Card>
        
        {/* Save Button */}
        <div className="flex justify-end">
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            className="w-full sm:w-auto"
          >
            {isSaving ? (
              <>Saving...</>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Preferences
              </>
            )}
          </Button>
        </div>
      </div>
    </PageWrapper>
  );
} 