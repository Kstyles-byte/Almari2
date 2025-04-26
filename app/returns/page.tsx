import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ReturnsPage() {
  return (
    <div className="container mx-auto py-10 space-y-6">
      <h1 className="text-3xl font-bold text-center">Return Policy</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">1. Introduction</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700">
            Zervia E-commerce Platform is committed to customer satisfaction. If you are not satisfied with your purchase, we're here to help with our Return Policy.
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">2. Eligibility for Returns</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700">
            To be eligible for a return, your item must be unused and in the same condition that you received it. Returns must be requested within 24 hours of pickup from the agent location.
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">3. Return Process</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700">
            To initiate a return, log into your account, go to your order history, and select the item you wish to return. Follow the prompts to request a return. Once approved, you will need to drop off the item at the designated agent location.
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">4. Refunds</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700">
            Once your return is received and inspected, we will notify you of the approval or rejection of your refund. If approved, your refund will be processed automatically through Paystack within a certain number of days.
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">5. Non-Returnable Items</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700">
            Certain items are non-returnable, including perishable goods, personalized items, and gift cards. Please check the product description for any specific return restrictions.
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">6. Contact Us</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700">
            If you have any questions about our Return Policy, please contact us at returns@zervia.com.
          </p>
        </CardContent>
      </Card>
    </div>
  );
} 