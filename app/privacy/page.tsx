import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PrivacyPage() {
  return (
    <div className="container mx-auto py-10 space-y-6">
      <h1 className="text-3xl font-bold text-center">Privacy Policy</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">1. Introduction</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700">
            At Zervia E-commerce Platform, we are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or use our services.
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">2. Information We Collect</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700">
            We may collect information about you in a variety of ways, including personal information you provide directly to us, information collected automatically through your use of our platform, and information from third-party sources.
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">3. How We Use Your Information</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700">
            We use the information we collect to operate and maintain our platform, process transactions, communicate with you, and improve our services. We may also use your information for marketing purposes with your consent.
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">4. Sharing Your Information</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700">
            We may share your information with third parties that perform services for us or on our behalf, including payment processing, data analysis, email delivery, hosting services, customer service, and marketing assistance.
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">5. Security of Your Information</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700">
            We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that no security measures are perfect or impenetrable.
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">6. Contact Us</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700">
            If you have questions or comments about this Privacy Policy, please contact us at privacy@zervia.com.
          </p>
        </CardContent>
      </Card>
    </div>
  );
} 