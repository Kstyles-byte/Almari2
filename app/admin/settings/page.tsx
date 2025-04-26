import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export default async function SettingsPage() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">System Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="general">
            <TabsList>
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="payments">Payments</TabsTrigger>
              <TabsTrigger value="shipping">Shipping</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
            </TabsList>
            <TabsContent value="general" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="siteName">Site Name</Label>
                  <Input id="siteName" defaultValue="Zervia E-commerce" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="siteUrl">Site URL</Label>
                  <Input id="siteUrl" defaultValue="https://zervia.example.com" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Label htmlFor="maintenanceMode">Maintenance Mode</Label>
                  <p className="text-sm text-gray-500">Enable to put the site in maintenance mode</p>
                </div>
                <div className="w-10 h-5 bg-gray-300 rounded-full"></div>
              </div>
              <Button>Save Changes</Button>
            </TabsContent>
            <TabsContent value="payments" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="paymentGateway">Default Payment Gateway</Label>
                  <Input id="paymentGateway" defaultValue="Paystack" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Default Currency</Label>
                  <Input id="currency" defaultValue="NGN" />
                </div>
              </div>
              <Button>Save Changes</Button>
            </TabsContent>
            <TabsContent value="shipping" className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Label htmlFor="agentDelivery">Agent-Based Delivery</Label>
                  <p className="text-sm text-gray-500">Enable agent-based delivery model</p>
                </div>
                <div className="w-10 h-5 bg-gray-300 rounded-full"></div>
              </div>
              <Button>Save Changes</Button>
            </TabsContent>
            <TabsContent value="notifications" className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Label htmlFor="emailNotifications">Email Notifications</Label>
                  <p className="text-sm text-gray-500">Enable email notifications for users</p>
                </div>
                <div className="w-10 h-5 bg-gray-300 rounded-full"></div>
              </div>
              <Button>Save Changes</Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
} 