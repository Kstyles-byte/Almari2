import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ShippingPage() {
  return (
    <div className="container mx-auto py-10 space-y-6">
      <h1 className="text-3xl font-bold text-center">Shipping Policy</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">1. Introduction</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700">
            At Zervia E-commerce Platform, we aim to deliver your orders efficiently and securely. This Shipping Policy outlines our shipping methods, costs, and estimated delivery times.
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">2. Shipping Methods</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700">
            We offer an agent-based delivery model where vendors drop off products at designated agent locations on campus. Customers can then pick up their orders from these locations.
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">3. Shipping Costs</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700">
            Shipping costs are calculated based on the agent location and the specifics of your order. Costs will be displayed at checkout before you finalize your purchase.
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">4. Delivery Times</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700">
            Estimated delivery times vary based on the vendor's processing time and the agent location. Typically, orders are available for pickup within 2-5 business days after processing.
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">5. Order Tracking</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700">
            Once your order is processed, you will receive a notification with a pickup code and agent location details. You can track the status of your order through your account dashboard.
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">6. Contact Us</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700">
            If you have any questions about our Shipping Policy, please contact us at shipping@zervia.com.
          </p>
        </CardContent>
      </Card>
    </div>
  );
} 